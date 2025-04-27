const User=require('../models/user')
const {StatusCodes}=require('http-status-codes')
const {BadRequestError,NotFoundError,UnauthenticatedError,CustomAPIError }=require('../errors/index')


const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            throw new BadRequestError('Please provide all required fields');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new BadRequestError('Email already exists');
        }

        // Create new user
        const user = await User.create({ ...req.body });
        const token = user.createJWT();

        res.status(StatusCodes.CREATED).json({ user, token });
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }
        // For unexpected errors
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Something went wrong, please try again' });
    }
};


const login = async(req, res) => {
    try {
        const {email, password} = req.body
        if(!email || !password) {
            throw new BadRequestError('please provide email and password')
        }
        
        const user = await User.findOne({email})
        if(!user) {
            throw new NotFoundError('User not found')
        }
        
        const passwordCheck = await user.comparePassword(password)
        if(!passwordCheck) {
            throw new UnauthenticatedError('Invalid password')
        }

        const token = user.createJWT()
        res.status(StatusCodes.OK).json({user, token})
    } catch (error) {
        // custom error
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }
        // unexpected errors
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Something went wrong' });
    }
}




module.exports={login,register}