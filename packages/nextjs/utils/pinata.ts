import axios from "axios";
import FormData from "form-data";
import fs from "fs";

interface PinFileProps {
  filePath: string;
  fileName: string;
}

export const pinFileToIPFS = async ({ filePath, fileName }: PinFileProps): Promise<any> => {

  const JWT = process.env.PINATA_JWT;
  if (!JWT) {
    throw new Error("PINATA_JWT is not defined in environment variables.");
  }

  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);

  formData.append("file", fileStream);

  const pinataMetadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", pinataOptions);

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity, // This is needed to prevent Axios from throwing a "Max body length exceeded" error
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
          Authorization: `Bearer ${JWT}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error; 
  }
};