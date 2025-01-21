import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ProductGrid } from './components/ProductGrid';
import { Search } from 'lucide-react';
import type { Product, UploadState } from './types';
import { products as initialProducts } from './data/products';
import { compareImages } from './utils/imageSimilarity';

function App() {
  const [uploadState, setUploadState] = useState<UploadState>({
    preview: null,
    loading: false,
    error: null
  });
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [minSimilarity, setMinSimilarity] = useState(0.5);

  const findSimilarProducts = async (imageUrl: string) => {
    try {
      setUploadState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      // Compare the uploaded image with each product image
      const productsWithScores = await Promise.all(
        initialProducts.map(async (product) => {
          const similarityScore = await compareImages(imageUrl, product.imageUrl);
          return {
            ...product,
            similarityScore
          };
        })
      );

      setMatchedProducts(
        productsWithScores
          .filter(p => (p.similarityScore || 0) >= minSimilarity)
          .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
      );
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: 'Failed to process image'
      }));
    } finally {
      setUploadState(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const handleImageSelect = async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      setUploadState(prev => ({
        ...prev,
        preview: imageUrl
      }));
      await findSimilarProducts(imageUrl);
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: 'Failed to process image'
      }));
    }
  };

  const handleUrlSubmit = async (url: string) => {
    try {
      setUploadState(prev => ({
        ...prev,
        preview: url
      }));
      await findSimilarProducts(url);
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: 'Failed to load image URL'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <Search className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900">Visual Product Matcher</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Reference Image</h2>
            <ImageUploader
              onImageSelect={handleImageSelect}
              onUrlSubmit={handleUrlSubmit}
            />
            {uploadState.error && (
              <p className="mt-2 text-sm text-red-600">{uploadState.error}</p>
            )}
          </div>

          {uploadState.preview && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Reference Image</h2>
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={uploadState.preview}
                  alt="Reference"
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          )}

          {(matchedProducts.length > 0 || uploadState.loading) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Similar Products</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="similarity" className="text-sm text-gray-600">
                    Min. Similarity:
                  </label>
                  <input
                    type="range"
                    id="similarity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minSimilarity}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setMinSimilarity(newValue);
                      if (uploadState.preview) {
                        findSimilarProducts(uploadState.preview);
                      }
                    }}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">
                    {(minSimilarity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <ProductGrid
                products={matchedProducts}
                loading={uploadState.loading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;