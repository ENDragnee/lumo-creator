"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText } from 'lucide-react';

const CustomNode = ({ data }: { data: { label: string; thumbnail: string | null } }) => {
  return (
    <>
      {/* Handle for incoming connections (target) */}
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Card className="w-64 shadow-lg border-border hover:border-primary transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="rounded-md">
                <AvatarImage src={data.thumbnail || ''} alt={data.label} />
                <AvatarFallback className="rounded-md bg-muted"><FileText /></AvatarFallback>
            </Avatar>
            <CardTitle className="text-base leading-tight">{data.label}</CardTitle>
          </div>
        </CardHeader>
      </Card>
      {/* Handle for outgoing connections (source) */}
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </>
  );
};

export default memo(CustomNode);
