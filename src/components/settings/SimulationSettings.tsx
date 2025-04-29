// components/settings/SimulationSettings.tsx
"use client"

import React from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimulationProps } from '@/components/user/simulation'; // Import props interface

export const SimulationSettings: React.FC = () => {
    const {
        actions: { setProp },
        // Destructure the actual props directly
        src,
        width,
        // height is managed by StackResizableWrapper via aspectRatio or direct resize
        aspectRatio,
        padding,
        // Add type assertion here
    } = useNode<SimulationProps>((node) => node.data.props as SimulationProps);

    // Helper to handle input changes (excluding aspectRatio, handled by select)
    // Input onChange always gives string, so value should be string type
    const handleInputChange = (
        propName: Exclude<keyof SimulationProps, 'aspectRatio' | 'height'>, // Exclude props not set via this input type
        value: string // Input elements provide string values
    ) => {
        // Explicitly type currentProps
        setProp((currentProps: SimulationProps) => {
            // Type checking is now satisfied:
            // - If propName is 'src', value (string) is assignable to currentProps.src (string).
            // - If propName is 'width' or 'padding', value (string) is assignable to currentProps[propName] (string | number).
            currentProps[propName] = value;
        });
    };

    // Helper for Select component change (specifically for aspectRatio)
    const handleSelectChange = (propName: 'aspectRatio', value: string) => {
        // Explicitly type currentProps
        setProp((currentProps: SimulationProps) => {
            // Assign directly, type 'string' is compatible with 'string | undefined'
            currentProps[propName] = value === "" ? undefined : value; // Set to undefined if empty string selected
        });
    };

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="src">Simulation URL</Label>
                <Input
                    id="src"
                    type="text"
                    value={src || ''} // Use destructured prop
                    onChange={(e) => handleInputChange('src', e.target.value)}
                    placeholder="https://example.com/simulation/embed"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                    id="width"
                    type="text" // Allow 'px' or '%'
                    value={width || ''} // Use destructured prop
                    onChange={(e) => handleInputChange('width', e.target.value)}
                    placeholder="e.g., 400px or 100%"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select
                    value={aspectRatio || ''} // Use destructured prop
                    onValueChange={(value) => handleSelectChange('aspectRatio', value)}
                >
                    <SelectTrigger id="aspectRatio">
                        <SelectValue placeholder="Select ratio (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="16/9">16:9 (Widescreen)</SelectItem>
                        <SelectItem value="4/3">4:3 (Standard)</SelectItem>
                        <SelectItem value="1/1">1:1 (Square)</SelectItem>
                        <SelectItem value="9/16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="">None (Manual Height)</SelectItem> {/* Represent 'None' with an empty string */}
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
            {/* Add any other simulation-specific settings here */}
        </div>
    );
};