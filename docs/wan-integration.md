# Wan Media Generation Integration

This document describes how to use the Wan media generation tools in Qwen CLI's Assistant Mode.

## Testing Status

The Wan tools have been successfully integrated and are ready for testing with a valid DashScope API key. Integration tests have been created following the project's TestRig framework.

## Overview

Wan is Alibaba's advanced media generation model family that supports:
- Image-to-Video generation (wan2.1-i2v-turbo, wan2.1-i2v-plus)
- Text-to-Video generation
- Image style transformation

## Prerequisites

1. You need a DashScope API key that works for both Qwen (text) and Wan (media) models
2. Set your API key: `export DASHSCOPE_API_KEY=your-key-here`

## Assistant Mode

Wan tools are only available in Assistant Mode to prevent accidental media generation during coding tasks:

```bash
# Launch in assistant mode
qwen --assistant
```

## Available Tools

### 1. Search Wan Models
Discover available Wan models and their capabilities:

```
search_wan_models
```

### 2. Generate Video from Image
Convert a static image into a dynamic video:

```
generate_image_to_video
  imageUrl: "https://example.com/image.jpg"
  prompt: "Make the person wave hello"  # Optional
  duration: 5  # 1-5 seconds for turbo, 1-10 for plus
```

### 3. Transform Image Style
Apply artistic transformations to images:

```
transform_image
  imageUrl: "https://example.com/photo.jpg"
  transformation: "cartoon"  # or: anime, oil_painting, watercolor, etc.
  strength: 0.8  # 0.0-1.0
```

### 4. Generate Video from Text
Create videos from text descriptions:

```
generate_video
  prompt: "A serene mountain landscape with moving clouds"
  duration: 10  # seconds
  resolution: "1080p"  # 720p, 1080p, or 4k
  language: "en"  # en, zh, or bilingual
```

## Important Notes

1. **URL Expiry**: Generated media URLs expire after 24 hours. Download important results immediately.

2. **Async Processing**: Media generation is asynchronous. The tools handle polling automatically and show progress.

3. **API Limits**: Be aware of rate limits and quotas on your DashScope account.

4. **Cost**: Media generation consumes tokens/credits. Check pricing at DashScope console.

## Example Workflow

```bash
# 1. Launch assistant mode
qwen --assistant

# 2. Search available models
> search_wan_models includeCapabilities: true

# 3. Generate a video from an image
> generate_image_to_video imageUrl: "https://example.com/portrait.jpg" prompt: "make the person smile and nod" duration: 5

# 4. Transform an image to cartoon style
> transform_image imageUrl: "https://example.com/photo.jpg" transformation: "cartoon"
```

## Troubleshooting

1. **"Local file paths not supported"**: Upload your images to a cloud service first
2. **"DASHSCOPE_API_KEY not found"**: Ensure your API key is set in environment
3. **Task timeout**: Large media generation can take several minutes
4. **"Not available in coding mode"**: Switch to assistant mode with `--assistant` flag