require("dotenv").config();

const cors = require("cors");
const express = require('express');
const timeout = require("connect-timeout");
const mongoose = require("mongoose");
const http = require("http");
const db = require("./db");
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const fsPromise = require('fs').promises;
const fs = require('fs');



const app = express();

const server = http.createServer(app);

app.use(
  cors("*"),
  express.json({ limit: "30kb" }),
  express.urlencoded({ extended: true }),
  timeout("60s", { respond: false })
);


app.get("/", async (req, res, next) => {

    const { address } = req.query;

    const addresses = await db.find({ address });

    const returnArr = addresses.map(async (addr) => {

        const contracts = await db.find({ contract: addr.contract }); 

        const currentLength = contracts.length;

        return { contract: addr.contract, desc: addr.desc, address: addr.address, ids: currentLength, cid: contracts.findIndex(x => x.address == address) + 1 };
        
    });

    res.json({ status: "success", data: await Promise.all(returnArr) });

});

app.get("/ping", async (req, res, next) => {
    return res.json({ status: "success", message: "pong", main: "Welcome to starkAI" });
});

app.post('/onmint', async (req, res) => {
        
        const { contract, address, desc } = req.body;
    
        if (!contract || !address || !desc) {
            return res.status(400).json(
            { status: "error", message: "Missing parameters" }
            );
        }
    
        await db.create({ contract, address, desc });
    
        return res.json({
            status: "success",
            message: "Created successfully",
        });
    
});

app.post('/ondeploy', async (req, res) => {
    
        const { contract, address, desc } = req.body;
    
        if (!contract || !address || !desc) {
            return res.status(400).json(
            { status: "error", message: "Missing parameters" }
            );
        }
    
        await db.create({ contract, address, desc });
    
        return res.json({
            status: "success",
            message: "Created successfully",
        });

});

app.post('/create', async (req, res) => {

    const { desc } = req.body;

    if (!desc) {
        return res.status(400).json(
          { status: "error", message: "Missing parameters" }
        );
    }

    const payload = {
      prompt: `A cartoonish, ${desc}`,
      output_format: "png",
      model: "sd3-medium",
    };

    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STABILITY || ""}`,
          Accept: "image/*",
        },
      }
    );

    if (response.status === 200) {
    
    const formData = new FormData();

    const filename = new Date().getTime();

    await fsPromise.writeFile(
      `./public/${filename}.png`,
      await sharp(Buffer.from(response.data)).resize(900, 900).png().toBuffer()
    );

    formData.append(
      "file",
      fs.createReadStream(`./public/${filename}.png`)
    );

    const pinataMetadata = JSON.stringify({
        name: `${filename}.png`,
    });

    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    const response2 = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity, // This is needed to prevent Axios from throwing a "Max body length exceeded" error
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT || ""}`,
        },
      }
    );

    console.log(response2.data);

    return res.json({
      status: "success",
      hash: response2.data?.IpfsHash,
      message: "Generated successfully ",
    });

    } else {

      return res.status(500).json(
        {
          status: "error",
          message: `${response.status}: ${response.data.toString()}`,
        },
      );
    }
});


(async () => {
    
  await mongoose.connect(process.env.NEXT_PUBLIC_HOST || "", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });


  console.log("Connected to DB");
})();

server.listen(3300, () => {
  console.log(`Server is running on port ${3300}`);
});
