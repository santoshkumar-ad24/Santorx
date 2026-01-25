const multer = require('multer');
const storage = multer.memoryStorage();

const uplaod = multer({
    storage: storage,
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter(req, file, cb){
        if(!file.mimetype.startsWith('image/')){
            return cb(new Error('Only image file uplaod'), false)
        }
        else{
            cb(null,true);
        }
    } 
});

module.exports = uplaod;