export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  similarityScore?: number;
  description: string;
}

export interface UploadState {
  preview: string | null;
  loading: boolean;
  error: string | null;
}