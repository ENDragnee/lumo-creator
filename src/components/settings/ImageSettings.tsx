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
        // Destructure props
        src,
        alt,
        width,
        height,
        objectFit,
        padding,
    } = useNode<ImageProps>((node) => node.data.props as ImageProps); // Added type assertion

    // Helper to handle input changes using immutable pattern
    const handleInputChange = (propName: InputChangePropNames, value: string) => { // Input always provides string
        // Use the immutable update pattern
        setProp((currentProps: ImageProps) => ({
            ...currentProps,
            // Assign the string value from the input
            // Type 'string' is assignable to 'string | number | undefined' for width/height/padding
            [propName]: value,
        }), 500); // Optional debounce
    };

    // Helper for Select component change using immutable pattern
    const handleSelectChange = (propName: 'objectFit', value: string) => {
         // Use the immutable update pattern
        setProp((currentProps: ImageProps) => ({
            ...currentProps,
            // Assert the value type as it comes from the Select component
            [propName]: value as ImageProps['objectFit'], // Keep assertion as objectFit has specific values
        }), 500); // Optional debounce
    };

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="src">Image URL</Label>
                <Input
                    id="src"
                    type="text"
                    value={src || ''}
                    onChange={(e) => handleInputChange('src', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                    id="alt"
                    type="text"
                    value={alt || ''}
                    onChange={(e) => handleInputChange('alt', e.target.value)}
                    placeholder="Descriptive text for accessibility"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                        id="width"
                        type="text" // Stays text type
                        value={width || ''}
                        onChange={(e) => handleInputChange('width', e.target.value)}
                        placeholder="e.g., 300px or 100%"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                        id="height"
                        type="text" // Stays text type
                        value={height || ''}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        placeholder="e.g., 200px or auto"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="objectFit">Object Fit</Label>
                <Select
                    // Default to 'contain' if objectFit is undefined/nullish
                    value={objectFit || 'contain'}
                    onValueChange={(value) => handleSelectChange('objectFit', value)}
                >
                    <SelectTrigger id="objectFit">
                        <SelectValue placeholder="Select fit" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* These values are fine as they are non-empty */}
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
                    type="text" // Stays text type
                    value={padding || ''}
                    onChange={(e) => handleInputChange('padding', e.target.value)}
                    placeholder="e.g., 0px or 8px"
                />
            </div>
        </div>
    );
};