"use client";

import Select from 'react-select';
import { IContentGraphItem } from '@/app/home/manage/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ListViewProps {
  contentItems: IContentGraphItem[];
  onPrerequisitesChange: (contentId: string, prerequisites: string[]) => void;
}

export function ListView({ contentItems, onPrerequisitesChange }: ListViewProps) {
  // Options for the dropdown, excluding the item itself
  const getOptions = (currentItemId: string) => {
    return contentItems
      .filter(item => item._id !== currentItemId)
      .map(item => ({ value: item._id, label: item.title }));
  };

  return (
    <div className="space-y-4">
      {contentItems.map(item => (
        <Card key={item._id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>Select one or more prerequisites for this content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              isMulti
              options={getOptions(item._id)}
              value={item.prerequisites?.map(id => ({ value: id, label: contentItems.find(c => c._id === id)?.title || 'Unknown' }))}
              onChange={(selectedOptions) => {
                const newPrerequisites = selectedOptions.map(option => option.value);
                onPrerequisitesChange(item._id, newPrerequisites);
              }}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
