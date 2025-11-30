const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.scanImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;

    // Determine project root (workspace) so we can find the top-level `scripts/` and `runs/` folders.
    const candidateRoots = [
      path.resolve(__dirname, '../../'), // backend folder
      path.resolve(__dirname, '../../..'), // one level up
      path.resolve(__dirname, '../../../'), // workspace root when opened from subfolder
      process.cwd(),
    ];

    let projectRoot = candidateRoots.find((p) => p && fs.existsSync(p));
    if (!projectRoot) projectRoot = path.resolve(__dirname, '../../');

    // Prefer script location in workspace root `scripts/detect_and_ocr.py`, fall back to backend/scripts
    let scriptPath = path.join(projectRoot, 'scripts', 'detect_and_ocr.py');
    if (!fs.existsSync(scriptPath)) {
      const alt = path.join(path.resolve(__dirname, '../../'), 'scripts', 'detect_and_ocr.py');
      if (fs.existsSync(alt)) scriptPath = alt;
    }

    const modelPath = path.join(projectRoot, 'runs', 'detect', 'train', 'weights', 'best.pt');

    if (!fs.existsSync(scriptPath)) {
      console.error('scanImage: python script not found at', scriptPath);
      return res.status(500).json({ error: `Python script not found: ${scriptPath}` });
    }
    if (!fs.existsSync(modelPath)) {
      console.error('scanImage: model not found at', modelPath);
      return res.status(500).json({ error: `Model file not found: ${modelPath}` });
    }

    const args = [scriptPath, modelPath, filePath, '0.25', 'ocr'];
    const py = spawn(process.env.PYTHON || 'python', args, { cwd: projectRoot });

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d) => stdout += d.toString());
    py.stderr.on('data', (d) => stderr += d.toString());

    py.on('close', (code) => {
      // optional: remove uploaded file
      // try { fs.unlinkSync(filePath); } catch(e){}

      if (code !== 0) {
        console.error('scanImage: python stderr:', stderr);
        return res.status(500).json({ error: stderr || `python exit ${code}` });
      }
      try {
        const result = JSON.parse(stdout || '{}');

        // map crop file paths to URLs served by this backend. Python writes crops to a folder (e.g. tmp_crops)
        // ensure uploads/tmp_crops exists inside backend uploads
        const uploadsTmp = path.join(__dirname, '../../uploads/tmp_crops');
        if (!fs.existsSync(uploadsTmp)) fs.mkdirSync(uploadsTmp, { recursive: true });

        if (result && Array.isArray(result.detections)) {
          result.crops = result.crops || [];
          result.detections = result.detections.map((d, i) => {
            const out = Object.assign({}, d);
            if (out.crop) {
              const cropPath = path.isAbsolute(out.crop) ? out.crop : path.join(projectRoot, out.crop);
              if (fs.existsSync(cropPath)) {
                const basename = path.basename(cropPath);
                const dest = path.join(uploadsTmp, basename);
                try { fs.copyFileSync(cropPath, dest); } catch (e) { /* ignore */ }
                const url = `${req.protocol}://${req.get('host')}/uploads/tmp_crops/${basename}`;
                out.crop_url = url;
                result.crops[i] = url;
              } else {
                out.crop_url = null;
              }
            }
            return out;
          });
        }

        return res.json(result);
      } catch (e) {
        console.error('scanImage: JSON parse error, stdout=', stdout);
        return res.status(500).json({ error: 'Invalid JSON from python', raw: stdout, err: e.message });
      }
    });
  } catch (err) {
    console.error('scanImage error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
