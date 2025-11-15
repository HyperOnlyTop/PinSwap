class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async registerUser(userData) {
        const newUser = new this.userModel(userData);
        return await newUser.save();
    }

    async findUserById(userId) {
        return await this.userModel.findById(userId);
    }

    async removeUser(userId) {
        return await this.userModel.findByIdAndDelete(userId);
    }

    // Additional methods can be added here as needed
}

export default UserService;