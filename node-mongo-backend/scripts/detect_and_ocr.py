#!/usr/bin/env python
import sys
import json
from pathlib import Path
from ultralytics import YOLO
import cv2

try:
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False


# ----------------------------
#   CẤU HÌNH LOẠI PIN
# ----------------------------

# MAPPING: class id -> tên pin
class_names = ["AAA", "AA", "C", "D", "9V"]

# MAPPING: class id -> điểm thưởng
POINTS = {
    0: 5,    # AAA
    1: 10,   # AA
    2: 20,   # C
    3: 20,   # D
    4: 50    # 9V
}


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: detect_and_ocr.py <model_path> <image_path> [conf] [ocr] [imgsz]"}))
        sys.exit(2)

    model_path = sys.argv[1]
    image_path = sys.argv[2]

    conf = 0.25
    do_ocr = False
    imgsz = 640  # phù hợp YOLOv8 đã train

    # Parse argument mở rộng
    for arg in sys.argv[3:]:
        a = arg.lower()
        if a == "ocr":
            do_ocr = True
            continue
        try:
            if "." in a or "e" in a:
                conf = float(a)
                continue
            imgsz = int(a)
            continue
        except:
            pass

    # Load YOLO
    model = YOLO(model_path)

    # Load ảnh
    img = cv2.imread(str(image_path))
    if img is None:
        print(json.dumps({"error": "cannot read image"}))
        sys.exit(2)

    results = model.predict(
        source=str(image_path),
        imgsz=imgsz,
        conf=conf,
        verbose=False
    )

    out = []
    total_points = 0

    crop_dir = Path("tmp_crops")
    crop_dir.mkdir(exist_ok=True)

    for r in results:
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            continue

        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        clss = boxes.cls.cpu().numpy()

        for i, b in enumerate(xyxy):
            score = float(confs[i])
            label = int(clss[i])

            # Bỏ box dưới mức ngưỡng
            if score < conf:
                continue

            x1, y1, x2, y2 = map(int, b.tolist())

            # Bỏ box quá nhỏ
            if (x2 - x1) < 5 or (y2 - y1) < 5:
                continue

            # CROP pin
            crop = img[y1:y2, x1:x2]
            crop_fname = crop_dir / f"{Path(image_path).stem}_crop_{i}.jpg"
            cv2.imwrite(str(crop_fname), crop)

            # OCR (nếu bật)
            ocr_text = ""
            if do_ocr and OCR_AVAILABLE:
                try:
                    ocr_text = pytesseract.image_to_string(
                        crop,
                        config="--psm 6"
                    ).strip()
                except:
                    pass

            # Loại pin từ YOLO
            pin_type = class_names[label]
            # Điểm thưởng
            points = POINTS.get(label, 0)
            total_points += points

            # try to get human-readable class name from model
            label_name = None
            try:
                names = getattr(model, 'names', None)
                if names is not None and int(label) in names:
                    label_name = names[int(label)]
                elif names is not None:
                    # names may be a dict or list
                    label_name = names[int(label)] if len(names) > int(label) else str(label)
            except Exception:
                label_name = str(label)

            out.append({
                'box': [x1, y1, x2, y2],
                'score': score,
                'confidence': score,
                'class': int(label),
                'label': label_name or str(label),
                'crop': str(crop_fname),
                'ocr': ocr_text,
            })
            

    # Trả kết quả JSON
    print(json.dumps({
        "detections": out,
        "total_points": total_points
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
