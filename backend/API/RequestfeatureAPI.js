const express = require('express');
const router = express.Router();

router.post("/request-feature", (req, res) => {

    try {
        const { user_name, user_email, user_phone, user_request_feature } = req.body;

        if (!user_name || !user_email || !user_request_feature) {
            return res.status(400).json({
                success: false,
                message: "Fields are required"
            })
        }
        return res.status(201).json({
            success: true,
            message: "Request submitted",
            data: {
                user_name,
                user_email,
                user_phone,
                user_request_feature
            }
        })

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    }
})

module.exports = router