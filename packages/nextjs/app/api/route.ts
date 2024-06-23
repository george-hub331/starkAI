import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import sharp from "sharp";


export async function GET(request: Request) {

    // const query = new URLSearchParams(request.);

    return Response.json(
        { status: "success", message: "Welcome to the Starknet API" },
        { status: 200 }
    );
}

export async function POST(request: Request) {

  const body = await request.json();

    const payload = {
        prompt: `A cartoonish, ${body.prompt}`,
        output_format: "png",
        model: "sd3-medium",
    };

   return Response.json({  status: "success", payload, message: "Generated successfully " }, { status: 200 }); 

}

// export async function POST() {

//   const payload = {
//     prompt: "A cartoonish ideal women",
//     output_format: "png",
//     model: "sd3-medium",
//   };

//   const response = await axios.postForm(
//     `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
//     axios.toFormData(payload, new FormData()),
//     {
//       validateStatus: undefined,
//       responseType: "arraybuffer",
//       headers: {
//         Authorization: `Bearer ${process.env.NEXT_PUBLIC_STABILITY || ""}`,
//         Accept: "image/*",
//       },
//     }
//   );

//   if (response.status === 200) {
//     fs.writeFile(
//       "./public/lighthouse.png",
//       await sharp(Buffer.from(response.data)).resize(900, 900).png().toBuffer()
//     );

//     return Response.json(
//       { status: "success", message: "Generated successfully " },
//       { status: 200 }
//     );
//   } else {
//     return Response.json(
//       {
//         status: "error",
//         message: `${response.status}: ${response.data.toString()}`,
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }
