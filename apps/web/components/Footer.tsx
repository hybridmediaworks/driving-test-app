import Image from "next/image";
import Paragraph from "@/components/ui/Paragraph";
import { Facebook, Instagram, Linkedin, Twitter } from "@/components/ui/SocialIcons";

export default function Footer() {
  return (
    <footer className="px-6 py-10 lg:py-30">
      <div className="mx-auto max-w-container space-y-15">
        <Image src="/company-logo.svg" alt="Company logo" width={146} height={48} className="h-10 w-auto" />

        <div className="flex flex-wrap justify-between gap-10">
          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              Car
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">
                Beginner Driver&apos;s Guide
              </a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">
                Driving Simulator
              </a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">
                VIN Decoder
              </a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">
                Permit Test Cheat Sheet
              </a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">
                Driver&apos;s Handbook
              </a>
            </div>
          </div>

          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              CDL
            </Paragraph>
            <div className="grid grid-cols-2 gap-x-15 gap-y-4">
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">CDL Class A</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Hazmat</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">CDL Class B</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Tanker</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">CDL Practice Test</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Passenger</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">CDL License FAQ</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Air Brakes</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">CDL Handbooks</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">School Bus</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Combinations</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Double&apos;s/Triples</a>
            </div>
          </div>

          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              Bike
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Beginner Driver&apos;s Guide</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Driving Simulator</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">VIN Decoder</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Permit Test Cheat Sheet</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Driver&apos;s Handbook</a>
            </div>
          </div>

          <div className="w-[45%] space-y-6 lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              About
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">About Us</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Contact Us</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Privacy Policy</a>
              <a href="#" className="text-base text-neutral-700 hover:text-neutral-800">Terms of Use</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <a href="#">
              <Image src="/appstore.svg" alt="Download on the App Store" width={135} height={40} className="h-10 w-auto" />
            </a>
            <a href="#">
              <Image src="/googleplay.svg" alt="Get it on Google Play" width={135} height={40} className="h-10 w-auto" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 px-2.5 text-base text-blue-500">
              <Facebook />
            </a>
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 px-2.5 text-base text-blue-500">
              <Twitter />
            </a>
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 px-2.5 text-base text-blue-500">
              <Instagram />
            </a>
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 px-2.5 text-base text-blue-500">
              <Linkedin />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
