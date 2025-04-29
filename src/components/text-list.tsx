"use client";

import { useEditor } from "@craftjs/core";
import { TextComponent } from "@/components/user/text";
import { HeaderComponent } from "@/components/user/HeaderComponent"; // Corrected import path if needed
import { FooterComponent } from "@/components/user/FooterComponent"; // Corrected import path if needed
import { Pilcrow, Footprints, Heading1 } from "lucide-react";
import { Button } from "@/components/ui/button";

// No props are needed as this component only renders creation buttons
export function TextList() {
  const { connectors } = useEditor();

  return (
    <div className="grid grid-cols-1 gap-2">
        <Button
            ref={(ref) => {
                // Pass the component type. Craft.js will use its default props.
                if (ref) connectors.create(ref, <TextComponent content="I am a textbox edit me"/>);
            }}
            variant="outline"
            className="w-full flex justify-start items-center gap-2"
            title="Drag or click to add a Textbox" // Add title for clarity
        >
            <Pilcrow className="h-4 w-4" /> Textbox
        </Button>
        <Button
            ref={(ref) => {
                // Pass the component type. Craft.js will use its default props.
                if (ref) connectors.create(ref, <HeaderComponent content="I am a header edit me"/>);
            }}
            variant="outline"
            className="w-full flex justify-start items-center gap-2"
            title="Drag or click to add a Header" // Add title for clarity
        >
            <Heading1 className="h-4 w-4" /> Header
        </Button>
        <Button
            ref={(ref) => {
                // Pass the component type. Craft.js will use its default props.
                if (ref) connectors.create(ref, <FooterComponent content="I am a footer edit me"/>);
            }}
            variant="outline"
            className="w-full flex justify-start items-center gap-2"
            title="Drag or click to add a Footer" // Add title for clarity
        >
            <Footprints className="h-4 w-4" /> Footer
        </Button>
    </div>
  );
}