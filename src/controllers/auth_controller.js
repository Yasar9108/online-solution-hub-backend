const authModel = require("../models/auth_model");
const Log_Tag = "[Auth Controller]==>"


async function registerUser(req, res){

    // In starting phase we are having only 2 user admin and employee, so we are not implementing any user registration logic, we will implement it in future if needed.
    
    console.debug(Log_Tag, "Entered into registerUser function: " + Date.now().toString());
    try{
        const {userName, password} = req.body;
        var jsonObj = new Object();
        jsonObj.userName = req.body.name;
        jsonObj.password = req.body.password;

        const records = new authModel(jsonObj);
        const result = await records.save();    
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(Log_Tag, "Error occurred while registering user: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}


async function loginUser(req, res) {
  console.debug(Log_Tag, "Entered loginUser:", Date.now());

  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await authModel.findOne({
      userName,
      password,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    user.loginAt = Date.now();
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      user: {
        userName: user.userName,
        role:
          user.userName === "admin"
            ? "admin"
            : "employee",
      },
    });
  } catch (error) {
    console.error(Log_Tag, error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}


module.exports = {
    registerUser,
    loginUser
}
