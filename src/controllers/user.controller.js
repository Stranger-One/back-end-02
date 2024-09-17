import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist: username, email
    // check for images and avatar
    // upload them to cloudinary: avatar
    // create user in database
    // remove password and refresh token field from response
    // check for user creation
    // return response


    const {fullname, email, username, password} = req.body
    console.log("email: ", email)
    
    if([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new apiError(400, "Please fill in all fields")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new apiError(409, "email or username existed, Please try another.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400, "Avatar file is required cloudinary error")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully")
    )


})

const loginUser = asyncHandler( async (req, res) => {
    
    // take req.body data
    // username or email
    // find user 
    // password check
    // refresh and access token
    // save cookie
    // send res
    
    const { email, username, password } = req.body;
    
    if(!username || !email){
        throw new apiError(400, "Username or Email is required")
    }

    const user = await User.findOne({ $or: [{username}, {email}] })

    if(!user){
        throw new apiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new apiError(404, "Invalid User Credentials (Password)")
    }

    

    

})

export {registerUser, loginUser}