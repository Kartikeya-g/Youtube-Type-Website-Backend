import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res) => {
    // Get user details from frontend
    // Validation - not empty
    // Check if user already exist : username, email
    // Check for image and avatar
    // Upload them to cloudinary
    // Create user objects - create entry in db
    // Remove password and refresh token field from response
    // Check for user creation
    // return res

    const {fullName, email, username, password} = req.body  // req.body se extract krre sare data points

    // console.log("email: ", email);

    // check krra ki kissi data point ne empty string to pass nhi kar di
    if (
        [fullName, email, username, password].some((field)=>
        field?.trim === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    /*
    if(fullName == "") {
        throw new ApiError(400, "fullname is required")
    }
    */

    // checks if the user exists or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    // if user exists throw the error and if the user does not exits than proceed 
    if(existedUser) {
        throw new ApiError(409, "User with email or username already exist.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // sab upload hone ke baad object create krdo
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // password or refresh token hata do jo recieve value he 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // if user is not created throw this error and if created than return statement will be executed
    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while registring a user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


export { registerUser }