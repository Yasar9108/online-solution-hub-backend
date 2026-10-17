const { json } = require("express");
const requestModel = require("../models/request_model");
const Log_Tag = "[Request Controller]==>"



async function createRequest(req , res){
    console.debug(Log_Tag, "Entered into createRequest function: " + Date.now().toString());
    try{
        const {name, email, phoneNumber, place, requestType, } = req.body;
        const createdAt = Date.now();
        const modifiedAt = Date.now();

        
        if(!name || !phoneNumber || !place || !requestType  ){
            return res.status(400).json({message: "All fields are required"});
        }

        var jsonObj = new Object();
        jsonObj.name = req.body.name;
        jsonObj.email = req.body.email;
        jsonObj.phoneNumber = req.body.phoneNumber;
        jsonObj.place = req.body.place;
        jsonObj.requestType = req.body.requestType;
        jsonObj.paymentStatus = "Pending";
        jsonObj.requestStatus ="received";
        jsonObj.createdAt = createdAt;
        jsonObj.modifiedAt = modifiedAt;    

        const request = new requestModel(jsonObj);
        await request.save();
        res.status(201).json({message: "Request created successfully"});
        
    }catch(err){
        console.error(Log_Tag, "Error occurred while creating request: " + err.message);
         res.status(500).json({message: "Internal server error"});
    }
    console.debug(Log_Tag, "Exited from createRequest function: " + Date.now().toString());
}


async function getAllRequests(req, res){
    console.debug(Log_Tag, "Entered into getAllRequests function: " + Date.now().toString());
    try{
        const getRequests = await requestModel.find();
        res.status(200).json(getRequests);
    }catch(err){
        console.error(Log_Tag, "Error occurred while fetching requests: " + err.message);
        res.status(500).json({message: "Internal server error"});
    }
    console.debug(Log_Tag, "Exited from getAllRequests function: " + Date.now().toString());
}

async function updateRequest(req, res){
    console.debug(Log_Tag, "Entered into updateRequest function: " + Date.now().toString());
    try{
       const {id} = req.params;
       if(!id){
        return res.status(404).json({
            message : "Id not found"
        })
       }

       var jsonObj = new Object();
       jsonObj.paymentStatus = req.body.paymentStatus;
       jsonObj.requestStatus = req.body.requestStatus;

       const updateRequest = await requestModel.findByIdAndUpdate(id,
        jsonObj
       )

       if(!updateRequest){
        return res.status(404).json({
            message : "Update failed"
        })
       }

       res.status(200).json({
            message: "Request updated successfully"
        });
    }catch(err){
        console.error(Log_Tag, "Error occurred while updating request: " + err.message);
        res.status(500).json({message: "Internal server error"});
    }
    console.debug(Log_Tag, "Exited from updateRequest function: " + Date.now().toString());
}

async function deleteRequest(req, res){
    console.debug(Log_Tag, "Entered into deleteRequest function: " + Date.now().toString());
    try{
        const {id}  = req.params;
        if(!id){
            return res.status(404).json({
                message : "Id not found"
            })
        }
        const deleteRecord = await requestModel.findByIdAndDelete(id);

        if(!deleteRecord){
            return res.status(404).json({
                message : " Records not found 404"
            })

        }

        res.status(200).json({
            message : "Record Deleted successfully"
        })
    }catch(err){
        console.error(Log_Tag, "Error occurred while deleting request: " + err.message);
        res.status(500).json({message: "Internal server error"});
    }    

}

module.exports = {
    createRequest,
    getAllRequests,
    updateRequest,
    deleteRequest
}

