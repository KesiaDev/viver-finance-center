import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: EmbedField[];
  footer: { text: string };
  timestamp: string;
}

interface ReportPreviewCardProps {
  embed: DiscordEmbed;
}

export const ReportPreviewCard = ({ embed }: ReportPreviewCardProps) => {
  // Converter cor decimal para CSS hex
  const borderColor = `#${embed.color.toString(16).padStart(6, '0')}`;
  
  // Agrupar campos para exibição inline
  const renderFields = () => {
    const rows: EmbedField[][] = [];
    let currentRow: EmbedField[] = [];
    
    embed.fields.forEach((field) => {
      if (field.inline) {
        currentRow.push(field);
        if (currentRow.length === 3) {
          rows.push(currentRow);
          currentRow = [];
        }
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]);
      }
    });
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows;
  };

  const fieldRows = renderFields();

  return (
    <Card 
      className="border-l-4 bg-[#2f3136] text-white overflow-hidden"
      style={{ borderLeftColor: borderColor }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">{embed.title}</CardTitle>
        <CardDescription className="whitespace-pre-line text-gray-300 text-sm">
          {embed.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fieldRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`grid gap-3 ${row.length === 1 ? 'grid-cols-1' : row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            {row.map((field, fieldIndex) => (
              <div key={fieldIndex} className="min-w-0">
                {field.name !== '\u200B' && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      {field.name}
                    </p>
                    <p className="text-sm text-gray-200 whitespace-pre-line break-words">
                      {field.value.replace(/\*\*/g, '').replace(/`/g, '')}
                    </p>
                  </>
                )}
                {field.name === '\u200B' && field.value && (
                  <p className="text-gray-500 text-sm">{field.value}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 border-t border-gray-600 pt-3">
        <div className="flex items-center justify-between w-full">
          <span>{embed.footer.text}</span>
          <span>{new Date(embed.timestamp).toLocaleString('pt-BR')}</span>
        </div>
      </CardFooter>
    </Card>
  );
};
