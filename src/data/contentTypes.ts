
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export interface Banner {
  id: string;
  imageUrl: string;
  altText: string;
  linkUrl?: string;
  isActive: boolean;
}
