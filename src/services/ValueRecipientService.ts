import { RSSItem } from '../types/feed';

export interface ValueRecipient {
  name: string;
  type: string;
  address: string;
  split: number;
  customKey?: string;
  customValue?: string;
}

export interface ValueBlock {
  type: string;
  method: string;
  suggested?: string;
  recipients: ValueRecipient[];
}

class ValueRecipientService {
  /**
   * Extract value recipients from an RSS item
   */
  extractValueRecipients(item: RSSItem): ValueBlock | null {
    if (!item['podcast:value']) {
      return null;
    }

    const value: any = item['podcast:value'];
    
    // Extract attributes
    const valueBlock: ValueBlock = {
      type: value['@_type'] || value.$?.type || 'lightning',
      method: value['@_method'] || value.$?.method || 'keysend',
      suggested: value['@_suggested'] || value.$?.suggested,
      recipients: []
    };

    // Extract recipients
    const recipients = value['podcast:valueRecipient'];
    if (!recipients) {
      return valueBlock;
    }

    // Ensure recipients is an array
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    
    valueBlock.recipients = recipientArray
      .map((recipient: any): ValueRecipient | null => {
        if (!recipient) return null;
        
        return {
          name: recipient['@_name'] || recipient.$?.name || '',
          type: recipient['@_type'] || recipient.$?.type || 'node',
          address: recipient['@_address'] || recipient.$?.address || '',
          split: parseFloat(recipient['@_split'] || recipient.$?.split || '0'),
          customKey: recipient['@_customKey'] || recipient.$?.customKey,
          customValue: recipient['@_customValue'] || recipient.$?.customValue
        };
      })
      .filter((r): r is ValueRecipient => r !== null);

    return valueBlock;
  }

  /**
   * Format value recipient for display
   */
  formatValueRecipient(recipient: ValueRecipient): string {
    return `${recipient.name} (${recipient.split}%)`;
  }

  /**
   * Format value block for display
   */
  formatValueBlock(valueBlock: ValueBlock): string {
    const recipientList = valueBlock.recipients
      .map(r => this.formatValueRecipient(r))
      .join(', ');
    
    return `${valueBlock.type} via ${valueBlock.method}: ${recipientList}`;
  }

  /**
   * Check if an episode has value recipients
   */
  hasValueRecipients(episode: RSSItem): boolean {
    return !!episode['podcast:value'];
  }
}

export const valueRecipientService = new ValueRecipientService();