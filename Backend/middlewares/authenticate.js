const jwt=require('jsonwebtoken')
const {UnauthenticatedError,CustomAPIError}=require('../errors/index')

const auth=async(req,res,next)=>{
    const authHeader=req.headers.authorization
    if(!authHeader || !authHeader.startsWith('Bearer')){
        throw new UnauthenticatedError('jwt token not provided/invalid')
    }
    const token=authHeader.split(' ')[1]

    try {
        const payload=jwt.verify(token,process.env.jwt_secret)
        //adding user info in the routes....if valid
        req.user = { userId: payload.userId, name: payload.name }
        next()

    } catch (error) {
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }else{
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'internal server error'});
        }   
        // throw new UnauthenticatedError('Authentication invalid')
    }
}
module.exports = auth
