// imports
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { encodeURL, createQR, findReference, FindReferenceError, validateTransfer } from "@solana/pay";
import BigNumber from "bignumber.js";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/router";
// Connecting to devnet for this example
console.log('Connecting to the Solana network\n');
const RPC = `https://mainnet.helius-rpc.com/?api-key=85b1b62b-6788-41cd-8979-13152d8ebf4c`
const connection = new Connection(RPC, 'confirmed');

export default function Home() {

  const router = useRouter();

  const { test } = router.query
  // URL Variables
  const [recipient, setRecipient] = useState();
  const [memo, setMemo] = useState("")
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState(new BigNumber(1));
  const [message, setMessage] = useState("");
  const [splToken, setSplToken] = useState("")
  const [reference, setReference] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isValidKey, setIsValidKey] = useState(false)
  const [url, setUrl] = useState("");
  const [activeToken, setActiveToken] = useState("");


  useEffect(() => {
    setReference(new Keypair().publicKey)
  }, [])

  const handleAddressChange = (e) => {

    try {
      const wallet = new PublicKey(e.target.value)
      setIsValidKey(PublicKey.isOnCurve(wallet.toBytes()))
      setRecipient(wallet)
    } catch {
      setIsValidKey(false)
    }
  }
  const createPayment = async () => {
    console.log("Creating a payment URL \n");
    setRecipient(new PublicKey(recipient));
    const url = encodeURL({
      recipient,
      splToken,
      amount,
      reference,
      label,
      message,
      memo,
    });

    setUrl(url)
    setQrCodeValue(url.toString()); // convert URL object to string
    checkPayment();
  }

  const handleTokenClick = (tokenPublicKey) => {
    setSplToken(new PublicKey(tokenPublicKey));
    setActiveToken(tokenPublicKey); // Set the active token
  };

  const buttonStyle = (tokenPublicKey) =>
    `px-4 py-2 font-bold text-white rounded ${activeToken === tokenPublicKey ? 'bg-purple-700' : 'bg-orange-600 hover:bg-purple-700'}`;

  const checkPayment = async () => {
    // update payment status
    setPaymentStatus('pending');

    console.log('Searching for the payment\n');
    let signatureInfo;

    const { signature } = await new Promise((resolve, reject) => {

      const interval = setInterval(async () => {
        console.count('Checking for transaction...' + reference);
        try {
          signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
          console.log('\n Signature: ', signatureInfo.signature, signatureInfo);
          clearInterval(interval);
          resolve(signatureInfo);
        } catch (error) {
          if (!(error instanceof FindReferenceError)) {
            console.error(error);
            clearInterval(interval);
            reject(error);
          }
        }
      }, 1000);
    });

    // Update payment status
    setPaymentStatus('confirmed');

    //validate transaction
    console.log('Validating the payment\n');
    try {
      await validateTransfer(connection, signature, { recipient: recipient, amount });

      // Update payment status
      setPaymentStatus('validated');
      console.log('Payment validated');

      return true;

    } catch (error) {
      console.error('Payment failed', error);
      return false;
    }
  }

  return (

    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl font-bold">
        MilyPay {test ? "Demo" : ""}
      </h1>
      <div className="w-full max-w-md p-6 mx-auto bg-white rounded-xl shadow-md">
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Store Name / Label:
          </label>
          <input
            type="text"
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
        </div><div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Memo / For:
          </label>
          <input
            type="text"
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
        </div><div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Message / Notes:
          </label>
          <input
            type="text"
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Pay To / Address:
          </label>
          <input
            type="text"
            onChange={handleAddressChange}
            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
          <div className="center border-1 text-xs text-red-500">
            {isValidKey ? '' : 'Wallet not valid. Please double check'}
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Amount:
          </label>
          <input
            type="number"
            onChange={(e) => setAmount(new BigNumber(e.target.value))}
            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex justify-center items-center space-x-2">
          <button
            className={buttonStyle('So11111111111111111111111111111111111111112')}
            onClick={() => handleTokenClick('So11111111111111111111111111111111111111112')}
          >
            SOL
          </button>

          <button
            className={buttonStyle('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')}
            onClick={() => handleTokenClick('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')}
          >
            USDC
          </button>

          <button
            className={buttonStyle('kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6')}
            onClick={() => handleTokenClick('kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6')}
          >
            KIN
          </button>
          <button
            className={buttonStyle('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')}
            onClick={() => handleTokenClick('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')}
          >
            SAMO
          </button>
          <button
            className={buttonStyle('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')}
            onClick={() => handleTokenClick('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')}
          >
            BONK
          </button>
        </div>
        <div className="flex justify-center items-center">
          <button
            className={`my-4 px-8 py-4 font-bold text-white ${isValidKey ? 'bg-purple-700 hover:bg-orange-700' : 'bg-gray-700 cursor-not-allowed '} rounded `}
            onClick={createPayment}
            disabled={!isValidKey}
          >
            Create QR Code
          </button>
        </div>
        <div>
          {paymentStatus === 'validated' ?
            <p className="mt-4 text-green-500 text-center">Payment Received. Thank you!</p>
            : <div className="flex justify-center mt-4">
              {qrCodeValue && <QRCode value={qrCodeValue} />}
            </div>}
        </div>
        <footer className="text-xs text-center">Made by <a className="animate-ping text-lg">:</a><a href={"https://milysec.com"} target="_blank">Milysec</a> | Powered by Solana</footer>
      </div>
      {test &&
        <>
          <small>{url.toString()}</small>
          <small>Name: {label}</small>
          <small>Memo: {memo}</small>
          <small>Message: {message}</small>
          <small>Address: {recipient.toString()} </small>
          <small>Token: {splToken.toString()}</small>
          <small>Amount: {amount.toString()}</small>
          <small>Reference: {reference.toString()}</small>
        </>
      }
    </div>

  );
}
