"use client";
import { Button, Icon } from "@/primitives";
import { FaArrowCircleRight } from "react-icons/fa";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { BsLightningCharge } from "react-icons/bs";
import { HiOutlineSignal } from "react-icons/hi2";
import { VscTools } from "react-icons/vsc";
import { usePathname } from "next/navigation";
import { Header } from "@/components";
import Image from "next/image";
import { FaXTwitter, FaLinkedin, FaDiscord, FaTelegram } from "react-icons/fa6";
import Reveal from "@/primitives/Reveal";
import AnimatedText from "@/primitives/AnimatedText";

const features = [
  {
    icon: <VscTools size={28} />,
    title: "Chain Supported",
    subTitle: "10x chain supported",
  },
  {
    icon: <IoShieldCheckmarkOutline size={28} />,
    title: "Secure and Safe",
    subTitle: "100% secure and safe",
  },
  {
    icon: <BsLightningCharge size={28} />,
    title: "Fast Transaction",
    subTitle: "100x fast transaction",
  },
  {
    icon: <HiOutlineSignal size={28} />,
    title: "Active Transaction",
    subTitle: "24/7 active transaction",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center font-khand text-white">
      <div className="w-full">
        <div className="flex h-screen flex-col justify-between bg-background1 bg-cover bg-center  bg-no-repeat p-10">
          <Header />
          <div className="flex  w-2/3 flex-col items-center justify-center gap-5 self-center text-center">
            <AnimatedText
              text={"Your One-Stop Access to Dencentralised Asset Swapping"}
              el="h1"
              once
              className="font-kavoon text-3xl font-medium text-[#FCFFFE]"
            />
            <p className="font-hubotsans_regular text-xl font-medium text-[#8E8E8E]">
              Welcome to waveswap where blockchain meet simplicity, seamlessly
              exchange assets across different chains with cofidence and ease
            </p>
            <Button variant="secondary" className="flex text-black">
              <span>Get started</span>
              <FaArrowCircleRight />
            </Button>
          </div>
          <div className="flex items-center justify-between justify-self-end rounded-md border-[0.5px] border-[#878787] p-8">
            {features.map((feature) => {
              return (
                <span className="flex flex-col items-center justify-center text-center font-hubotsans_regular font-semibold text-white">
                  {feature.icon}
                  <p className="text-lg">{feature.title}</p>
                  <p className="text-sm">{feature.subTitle}</p>
                </span>
              );
            })}
          </div>
        </div>
        <div className="bg-[#030C1A] font-hubotsans_regular">
          <Reveal
            className="flex flex-col items-center justify-center gap-5 p-10 text-center"
            delay={1.2}
            duration={0.6}
          >
            <h2 className="text-2xl font-bold text-white">
              Cross- Chain compatibility
            </h2>
            <p className="w-2/3 text-[#8E8E8E]">
              Unlock the potential of diverse blockchain networks waveswap
              enables you to effortlessly conduct transactions across different
              chains expanding your possibility
            </p>
            <div className="flex items-center gap-5">
              <Image
                src={"/Ethereum3D.svg"}
                alt="Ethereum3D"
                height={72}
                width={72}
              />
              <Image
                src={"/Avalanche3D.svg"}
                alt="Avalanche3D"
                height={72}
                width={72}
              />
              <Image
                src={"/Cosmos3D.svg"}
                alt="Cosmos3D"
                height={72}
                width={72}
              />
              <Image
                src={"/Polygon3D.svg"}
                alt="Polygon3D"
                height={72}
                width={72}
              />
              <Image
                src={"/Solana3D.svg"}
                alt="Solana3D"
                height={72}
                width={72}
              />
              <Image
                src={"/USDCoin3D.svg"}
                alt="USDCoin3D"
                height={72}
                width={72}
              />
            </div>
          </Reveal>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 bg-[#030C1A] p-10 text-center font-hubotsans_regular text-white">
          <h2 className="text-3xl font-bold">What we offer</h2>
          <div className="grid grid-cols-2 gap-4">
            <Reveal
              className="flex flex-col justify-center gap-4 text-left"
              delay={1}
            >
              <h2 className="text-xl font-bold">Autonomous trading platform</h2>
              <p className="text-lg font-medium text-[#8E8E8E]">
                Eliminate the need for traditional intermediaries and trade any
                crypto asset with ease
              </p>
            </Reveal>
            <Reveal className="flex w-full items-center justify-end" delay={1}>
              <Image
                src={"/swap.png"}
                alt="swap"
                width="0"
                height="0"
                sizes="100vw"
                style={{ width: "50%", height: "auto" }}
              />
            </Reveal>
            <Reveal
              className="flex w-full items-center justify-start"
              delay={1.2}
            >
              <Image
                src={"/pool.png"}
                alt="swap"
                width="0"
                height="0"
                sizes="100vw"
                style={{ width: "50%", height: "auto" }}
              />
            </Reveal>
            <Reveal
              className="flex flex-col justify-center gap-4 text-left"
              delay={1.2}
            >
              <h2 className="text-xl font-bold">Liquidity provider</h2>
              <p className="text-lg font-medium text-[#8E8E8E]">
                Earn passive income by putting your funds to work by providing
                to a launchpad liquidity.
              </p>
            </Reveal>
            <Reveal
              className="flex flex-col justify-center gap-4 text-left"
              delay={1.4}
            >
              <h2 className="text-xl font-bold">
                Decentralized lending Protocol
              </h2>
              <p className="text-lg font-medium text-[#8E8E8E]">
                Without the need of intermediaries such as banks or financial
                institutions, lend and borrow crypto assets.
              </p>
            </Reveal>
            <Reveal
              className="flex w-full items-center justify-end"
              delay={1.4}
            >
              <Image
                src={"/lend.png"}
                alt="swap"
                width="0"
                height="0"
                sizes="100vw"
                style={{ width: "50%", height: "auto" }}
              />
            </Reveal>
          </div>
        </div>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-5 bg-[#030C1A] p-10 text-center font-hubotsans_regular text-white">
          <Reveal
            duration={0.8}
            delay={1.6}
            className="flex w-2/3 flex-col items-center justify-center gap-5 self-center text-center"
          >
            <h1 className="text-3xl font-bold text-[#FCFFFE]">
              Get on our token list
            </h1>
            <p className="font-hubotsans_regular text-xl font-medium text-[#8E8E8E]">
              Join us in our mission to revolutionize decentralized finance
              while building trust and credibility.Projects that wish to have
              their token show in the default swap list will need to submit
              their information via our partner portal. Otherwise users can
              search for any supported token via the contract address.{" "}
            </p>
            <Button variant="secondary" className="flex text-black">
              <span>Apply now</span>
              <FaArrowCircleRight />
            </Button>
          </Reveal>
        </div>
        <footer className="flex items-center  justify-around gap-5 bg-[#030C1A] p-10 text-center font-hubotsans_regular text-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <Icon name="weavelogo" />
              <h1 className="font-kavoon text-2xl">Weaveswap</h1>
            </div>
            <p className="text-sm text-[#8E8E8E]">
              Make trading more easier with weaveswap
            </p>
            <span className="flex items-center gap-2">
              <FaXTwitter size={20} />
              <FaDiscord size={20} />
              <FaTelegram size={20} />
              <FaLinkedin size={20} />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2 text-left">
              <h3 className="font-bold">Company</h3>
              <ul className="flex flex-col gap-1 text-sm">
                <li>Home</li>
                <li>About us</li>
                <li>Community</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <h3 className="font-bold">Product</h3>
              <ul className="flex flex-col gap-1 text-sm">
                <li>Swap</li>
                <li>Lend</li>
                <li>Pool</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <h3 className="font-bold">Resources</h3>
              <ul className="flex flex-col gap-1 text-sm">
                <li>Ecosystem</li>
                <li>For developers</li>
                <li>Tokenisation</li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
