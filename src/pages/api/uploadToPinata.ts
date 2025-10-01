import type { NextApiRequest, NextApiResponse } from "next";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body.file; // base64 string from frontend
    const metadata = req.body.metadata; // { name, description }

    // Convert base64 to buffer
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", buffer, "image.png");
    formData.append("pinataMetadata", JSON.stringify({ name: metadata.name }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_API_SECRET!,
      },
    });

    // Return IPFS hash
    const ipfsHash = response.data.IpfsHash;

    // Metadata JSON URL
    const metadataJson = {
      name: metadata.name,
      description: metadata.description,
      image: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    };

    // Pin metadata JSON to IPFS
    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadataJson,
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY!,
          pinata_secret_api_key: process.env.PINATA_API_SECRET!,
        },
      }
    );

    const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;
    res.status(200).json({ tokenURI });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
