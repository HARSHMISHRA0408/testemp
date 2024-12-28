// import dbConnect from '../../utils/db';
// import User from '../../models/UsersModel';
// import bcrypt from 'bcryptjs'; // For hashing passwords
// import jwt from 'jsonwebtoken'; // For generating Web Tokens

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method !== 'POST') {
//     return res.status(405).json({ success: false, message: 'Method not allowed' });
//   }

//   try {
//     const { email, password } = req.body;

//     // Check for missing required fields
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Email and password are required' });
//     }

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ success: false, message: 'Email Not Found' });
//     }

//     // Compare the provided password with the hashed password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: 'Invalid Password' });
//     }

//     // Generate a JWT token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET, // Use a secret key from your environment variables
//       { expiresIn: '1h' } // Token expiration time
//     );

//     // Respond with user information and token
//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       user: {
//         id: user._id,
//         email: user.email,
//       },
//       token, // Return the JWT token
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error logging in' });
//   }
// }

// pages/api/userLogin.js
import dbConnect from '../../utils/db';
import User from '../../models/UsersModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email Not Found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Password' });
    }

    // Include the role in the JWT payload
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role , knowledgeArea: user.knowledgeArea , category:user.category, test: user.test},
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
}