import React, { useState } from 'react';
import CardForm from './components/CardForm';
import CardPreview from './components/CardPreview';
import type { CardFormData } from './types';
import { readFileAsDataUrl } from './utils';
import axios from "axios";
import { ethers } from "ethers";
import AmoyNFTAbi from "@/nft_amoy_abi.json"; // adjust path if needed
import SepoliaNFTAbi from "@/nft_sepolia_abi.json";
import { connectWallet, switchToChain, getWalletInfo, CHAIN_INFO } from "~/utils/chainUtils";
import { useEffect } from 'react';


const CardModule: React.FC = () => {
  const [formData, setFormData] = useState<CardFormData>({
    collectionName: '',
    batchNumber: '',
    issuerBusinessName: '',
    batchDescription: '',
    noOfCards: 1,
    cardName: '',
    prefixId: '',
    issueDate: '',
    expireDate: '',
    price: 0,
    currencyType: 'USD',
    cardGraphic: null,
  });

  const initialFormData: CardFormData = {
    collectionName: '',
    batchNumber: '',
    issuerBusinessName: '',
    batchDescription: '',
    noOfCards: 1,
    cardName: '',
    prefixId: '',
    issueDate: '',
    expireDate: '',
    price: 0,
    currencyType: 'USD',
    cardGraphic: null,
  };


  const [imagePreview, setImagePreview] = useState<string>('');
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const initWallet = async () => {
      try {
        const wallet = await connectWallet();
        setAccount(wallet.account);
        setChainId(wallet.chainId);
        try {
          // Try switching to Sepolia
          await switchToChain("0xaa36a7");
          const updated = await getWalletInfo();
          setChainId(updated.chainId);
        } catch (switchErr: any) {
          if (switchErr.message.includes("User rejected")) {
            alert("You must switch to Sepolia or Amoy to use this app.");
          } else {
            alert("Please manually add Sepolia or Amoy in MetaMask settings.");
            console.error("Switch failed:", switchErr);
          }
        }
      } catch (err) {
        // setError(err?.message || String(err));
        console.log(err);
        setError('Failed to connect wallet');
      }
    };

    void initWallet();

    // Listen for account or chain changes
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      ethereum.on("chainChanged", (chainId: string) => {
        setChainId(chainId);
      });
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, cardGraphic: file }));
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setImagePreview(dataUrl);
      } catch (err) {
        console.error('Failed to read file', err);
      }
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!formData.cardGraphic) return;

  //   try {
  //     const tokenBase64 = await readFileAsDataUrl(formData.cardGraphic);

  //     const pinataRes = await axios.post("/api/uploadToPinata", {
  //       file: tokenBase64,
  //       metadata: {
  //         name: formData.cardName,
  //         description: formData.batchDescription,
  //       },
  //     });

  //     const tokenURI = pinataRes.data.tokenURI;



  //     // 3. Connect to MetaMask
  //     const { ethereum } = window;
  //     if (!ethereum) throw new Error("MetaMask not found");

  //     const provider = new ethers.BrowserProvider(ethereum);
  //     const signer = await provider.getSigner();

  //     let contract: ethers.Contract; 
  //     // 4. Connect to your deployed contract
  //     if(chainId == "0x13882"){
  //       const contractAddress = process.env.NEXT_PUBLIC_NFT_AMOY_CONTRACT_ADDRESS!;
  //       contract = new ethers.Contract(contractAddress, AmoyNFTAbi, signer);
  //     }else{
  //       const contractAddress = process.env.NEXT_PUBLIC_NFT_SEPOLIA_CONTRACT_ADDRESS!;
  //       console.log(contractAddress)
  //       contract = new ethers.Contract(contractAddress, SepoliaNFTAbi, signer);
  //     }



  //     // 5. Mint NFT
  //     const tx = await contract.mint(
  //       await signer.getAddress(), // recipient
  //       formData.batchNumber || 1, // collectionId or tokenId
  //       tokenURI                   // metadata URI
  //     );

  //     await tx.wait();

  //     alert("NFT minted successfully!");

  //     setFormData(initialFormData);
  //     setImagePreview('');

  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err.message || "Something went wrong");
  //   }
  // };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardGraphic) return;

    try {
      setIsSubmitting(true);
      setStatus("Reading file...");

      const tokenBase64 = await readFileAsDataUrl(formData.cardGraphic);
      setStatus("Uploading file to Pinata...");

      const pinataRes = await axios.post("/api/uploadToPinata", {
        file: tokenBase64,
        metadata: {
          name: formData.cardName,
          description: formData.batchDescription,
        },
      });

      const tokenURI = pinataRes.data.tokenURI;
      setStatus("Connecting to MetaMask...");

      const { ethereum } = window;
      if (!ethereum) throw new Error("MetaMask not found");

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      setStatus("Connecting to smart contract...");

      let contract: ethers.Contract;
      if (chainId == "0x13882") {
        const contractAddress = process.env.NEXT_PUBLIC_NFT_AMOY_CONTRACT_ADDRESS!;
        contract = new ethers.Contract(contractAddress, AmoyNFTAbi, signer);
      } else {
        const contractAddress = process.env.NEXT_PUBLIC_NFT_SEPOLIA_CONTRACT_ADDRESS!;
        contract = new ethers.Contract(contractAddress, SepoliaNFTAbi, signer);
      }

      setStatus("Minting NFT...");

      const tx = await contract.mint(
        await signer.getAddress(), // recipient
        formData.batchNumber || 1, // collectionId or tokenId
        tokenURI                   // metadata URI
      );

      setStatus("Waiting for transaction confirmation...");
      await tx.wait();

      setStatus("NFT minted successfully!");
      setFormData(initialFormData);
      setImagePreview("");

    } catch (err: any) {
      console.error(err);

      // Handle user rejection
      if (err.error?.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction cancelled by user.");
        setStatus("");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Loyalty Card Creator</h1>
          <p className="text-gray-600">Design and deploy your loyalty card collection</p>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            {error && (
              <span className="bg-red-100 border-red-300 text-red-800 px-3 py-1 rounded-md border-2 inline-block">
                <strong>Error:</strong> {error}
              </span>
            )}

            {status && (
              <span className="bg-green-100 border-green-300 text-green-800 px-3 py-1 rounded-md border-2 inline-block">
                <strong>Status:</strong> {status}
              </span>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <span className="bg-blue-100 border-blue-300 text-blue-800 px-3 py-1 rounded-md border-2">
                <strong>Wallet:</strong> {account || "Not connected"}
              </span>
              <span className="bg-purple-100 border-purple-300 text-purple-800 px-3 py-1 rounded-md border-2">
                <strong>Current Chain:</strong> {CHAIN_INFO[chainId ?? ""]?.name || "Unknown"}
              </span>
            </div>

            <button
              onClick={() => switchToChain(chainId === "0xaa36a7" ? "0x13882" : "0xaa36a7")}
              className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Switch to {chainId === "0xaa36a7" ? "Amoy" : "Sepolia"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <CardForm
            formData={formData}
            onInputChange={handleInputChange}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          <CardPreview formData={formData} imagePreview={imagePreview} />
        </div>
      </div>
    </div>
  );
};

export default CardModule;
