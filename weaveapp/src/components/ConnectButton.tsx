import { ConnectButton } from "@rainbow-me/rainbowkit";
import makeBlockie from "ethereum-blockies-base64";
import Image from "next/image";
import { Button } from "@/primitives";
import { FaChevronDown } from "react-icons/fa";

export const WalletConnectButton = ({
  className,
  isHome,
}: {
  className?: string;
  isHome: boolean;
}) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            className={`${
              !ready
                ? "pointer-events-none select-none opacity-0"
                : "opacity-100"
            }`}
            aria-hidden={!ready}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    className={className}
                    onClick={openConnectModal}
                    type="button"
                    variant="primary"
                    isHome={isHome}
                  >
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    type="button"
                    variant="primary"
                    isHome={isHome}
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="flex gap-3 font-kavoon">
                  <div className="relative" onClick={openChainModal}>
                    <div className="flex items-center">
                      <Image
                        className="border-ui-lightBlue rounded-[100%] border-2"
                        height={40}
                        width={40}
                        src={makeBlockie(
                          account?.displayBalance ?? "delegateth",
                        )}
                        alt="avatar"
                      />
                      {chain.hasIcon && (
                        <div
                          className="absolute bottom-0 right-0 h-4 w-4 overflow-hidden rounded-[100%] bg-white"
                          style={{ backgroundColor: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="h-full w-full"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-pointer text-sm text-white dark:text-white"
                        onClick={openAccountModal}
                      >
                        {account.displayName}
                      </div>
                    </div>
                    <div
                      className="mt-1 flex cursor-pointer items-center gap-2 text-xs font-bold text-black dark:text-white"
                      onClick={openChainModal}
                    >
                      {chain.name} <FaChevronDown width="14" height="14" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
