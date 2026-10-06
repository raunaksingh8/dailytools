const express = require('express');
const router = express.Router();

const pool = require('../config/db');


//post api
router.post('/update-feature', async (req, res) => {

    try {
        const {
            title,
            message,
            type,
            link,
        } = req.body;

        if (!title || !message || !type)
            return res.status(400).json({
                success: false,
                message: "Title, message and type are required",
            })
        if (title.length > 50)
            return res.status(400).json({
                success: false,
                message: "Title length should be below 50 characters"
            })
        if (message.length > 150)
            return res.status(400).json({
                success: false,
                message: "Message length should be below 150 Characters"
            })

        const result = await pool.query("INSERT INTO notifications (title,message,type,link) VALUES ($1,$2,$3,$4) RETURNING *", [title, message, type, link]);
        return res.status(201).json({
            success: true,
            message: "Updates recorded successfully",
            data: result.rows
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

//get api

router.get('/get-updates', async (req, res) => {
    try {
        const result = await pool.query("SELECT title,message,link from notifications where is_active=true order by created_at desc");
        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No Data Found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Data Fetched Successfuly",
            data: result.rows
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})




module.exports = router