// components/settings/ImageSettings.tsx
"use client"

import React from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label'; // Assuming shadcn/ui
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageProps } from '@/components/user/image'; // Import props interface

// Define a type for props handled by the generic input handler
type InputChangePropNames = Exclude<keyof ImageProps, 'objectFit'>;

export const ImageSettings: React.FC = () => {
    const {
        actions: { setProp },
        // Destructure the actual props directly from the hook's return value
        src,
        alt,
        width,
        height,
        objectFit,
        padding,
    } = useNode<ImageProps>((node) => node.data.props); // Selector returns ImageProps directly

    // Helper to handle input changes and update props (excluding objectFit)
    const handleInputChange = (propName: InputChangePropNames, value: string | number) => {
        // Explicitly type currentProps
        setProp((currentProps: ImageProps) => {
            // This assignment is now safer because propName cannot be 'objectFit'
            currentProps[propName] = value as string;
        });
    };

    // Helper for Select component change (specifically for objectFit)
    const handleSelectChange = (propName: 'objectFit', value: string) => {
        // Explicitly type currentProps
        setProp((currentProps: ImageProps) => {
            // Assert the value type as it comes from the Select component
            currentProps[propName] = value as ImageProps['objectFit'];
        });
    };

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="src">Image URL</Label>
                <Input
                    id="src"
                    type="text"
                    value={src || ''} // Use destructured prop
                    onChange={(e) => handleInputChange('src', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                    id="alt"
                    type="text"
                    value={alt || ''} // Use destructured prop
                    onChange={(e) => handleInputChange('alt', e.target.value)}
                    placeholder="Descriptive text for accessibility"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                        id="width"
                        type="text"
                        value={width || ''} // Use destructured prop
                        onChange={(e) => handleInputChange('width', e.target.value)}
                        placeholder="e.g., 300px or 100%"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                        id="height"
                        type="text"
                        value={height || ''} // Use destructured prop
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        placeholder="e.g., 200px or auto"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="objectFit">Object Fit</Label>
                <Select
                    value={objectFit || 'contain'} // Use destructured prop
                    onValueChange={(value) => handleSelectChange('objectFit', value)}
                >
                    <SelectTrigger id="objectFit">
                        <SelectValue placeholder="Select fit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="scale-down">Scale Down</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="padding">Padding</Label>
                <Input
                    id="padding"
                    type="text"
                    value={padding || ''} // Use destructured prop
                    onChange={(e) => handleInputChange('padding', e.target.value)}
                    placeholder="e.g., 0px or 8px"
                />
            </div>
        </div>
    );
};