const request = require('supertest');
const app = require('../src/index'); // Adjust the path if necessary
const UserService = require('../src/services/userService');

jest.mock('../src/services/userService');

describe('User API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should create a new user', async () => {
        const newUser = { name: 'John Doe', email: 'john@example.com' };
        UserService.prototype.registerUser.mockResolvedValue(newUser);

        const response = await request(app)
            .post('/api/users')
            .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(newUser);
        expect(UserService.prototype.registerUser).toHaveBeenCalledWith(newUser);
    });

    test('should get a user by ID', async () => {
        const userId = '12345';
        const user = { id: userId, name: 'John Doe', email: 'john@example.com' };
        UserService.prototype.findUserById.mockResolvedValue(user);

        const response = await request(app)
            .get(`/api/users/${userId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(user);
        expect(UserService.prototype.findUserById).toHaveBeenCalledWith(userId);
    });

    test('should update a user', async () => {
        const userId = '12345';
        const updatedUser = { name: 'Jane Doe', email: 'jane@example.com' };
        UserService.prototype.updateUser.mockResolvedValue(updatedUser);

        const response = await request(app)
            .put(`/api/users/${userId}`)
            .send(updatedUser);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedUser);
        expect(UserService.prototype.updateUser).toHaveBeenCalledWith(userId, updatedUser);
    });

    test('should delete a user', async () => {
        const userId = '12345';
        UserService.prototype.removeUser.mockResolvedValue(true);

        const response = await request(app)
            .delete(`/api/users/${userId}`);

        expect(response.status).toBe(204);
        expect(UserService.prototype.removeUser).toHaveBeenCalledWith(userId);
    });
});