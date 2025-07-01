# Wan Tools Testing Guide

This guide covers how to test the Wan media generation tools integration.

## Test Levels

### 1. Unit Tests
Located in: `packages/core/src/tools/__tests__/wan-tools.integration.test.ts`

These tests mock the WanContentGenerator and verify:
- Tool configuration and schema
- Input validation
- Error handling
- Model selection logic

Run with:
```bash
npm test -- wan-tools.integration
```

### 2. Mock Integration Tests
Located in: `integration-tests/wan-mock.test.ts`

These tests use mocked API responses and verify:
- Complete async task flow
- Progress tracking
- Error scenarios
- Model selection based on parameters

Run with:
```bash
npm run test:wan:mock
```

### 3. E2E Tests (Real API)
Located in: `integration-tests/wan-e2e.test.ts`

These tests make real API calls and verify:
- Actual API integration
- Assistant mode requirements
- Real media generation (if using valid test images)

Run with:
```bash
# Requires valid API key
DASHSCOPE_API_KEY=your-key npm run test:wan:e2e
```

## Test Scenarios

### Search Models Test
```bash
# Test listing all models
qwen --assistant -p "search_wan_models modelType: all includeCapabilities: true"

# Test filtering by type
qwen --assistant -p "search_wan_models modelType: image_to_video"
```

### Image-to-Video Tests
```bash
# Test with valid image URL
qwen --assistant -p "generate_image_to_video imageUrl: https://example.com/test.jpg duration: 5"

# Test local file rejection
qwen --assistant -p "generate_image_to_video imageUrl: /local/file.jpg"

# Test with prompt
qwen --assistant -p "generate_image_to_video imageUrl: https://example.com/portrait.jpg prompt: 'make the person smile' duration: 3"
```

### Transform Image Tests
```bash
# Test cartoon transformation
qwen --assistant -p "transform_image imageUrl: https://example.com/photo.jpg transformation: cartoon"

# Test custom transformation
qwen --assistant -p "transform_image imageUrl: https://example.com/photo.jpg transformation: custom prompt: 'make it look like a watercolor painting'"
```

### Text-to-Video Tests
```bash
# Basic generation
qwen --assistant -p "generate_video prompt: 'A serene mountain landscape' duration: 10"

# With all parameters
qwen --assistant -p "generate_video prompt: 'Ocean waves at sunset' duration: 15 resolution: 1080p language: en aspectRatio: 16:9"
```

## Manual Testing Checklist

### Prerequisites
- [ ] Valid DASHSCOPE_API_KEY environment variable
- [ ] Project built with `npm run build`
- [ ] Test image URLs available (publicly accessible)

### Basic Functionality
- [ ] Wan tools only available in assistant mode (`--assistant` flag)
- [ ] Search models tool lists all available models
- [ ] Local file paths are rejected with appropriate message
- [ ] Valid URLs are accepted and processed

### Async Task Flow
- [ ] Task creation returns pending status
- [ ] Progress updates during processing
- [ ] Final success/failure status received
- [ ] Generated media URLs are returned

### Error Handling
- [ ] Invalid image format errors handled gracefully
- [ ] Task timeout errors handled
- [ ] API errors displayed clearly
- [ ] Network errors don't crash the CLI

### URL Expiry Warning
- [ ] Generated URLs include 24-hour expiry warning
- [ ] Warning is visible in output

## Performance Testing

### Response Times
- Model search: < 1 second
- Task creation: < 2 seconds
- Status polling: 2 second intervals
- Total generation time:
  - Image-to-video (turbo): 30-60 seconds
  - Image-to-video (plus): 60-120 seconds
  - Text-to-video: 60-180 seconds
  - Image transformation: 20-40 seconds

### Load Testing
For production use, consider:
- API rate limits
- Concurrent task limits
- Token/credit consumption
- Response caching where appropriate

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Wan Mock Tests
  run: npm run test:wan:mock

# Only run E2E tests on manual trigger or release
- name: Run Wan E2E Tests
  if: github.event_name == 'workflow_dispatch'
  env:
    DASHSCOPE_API_KEY: ${{ secrets.DASHSCOPE_API_KEY }}
  run: npm run test:wan:e2e
```

## Debugging Tips

1. **Enable debug mode**: `qwen --assistant --debug -p "..."`
2. **Check API responses**: Look for task IDs in output
3. **Monitor progress**: Progress logs show during generation
4. **Verify assistant mode**: Tools won't be available without `--assistant`

## Common Issues

### "Tool not found"
- Ensure you're using `--assistant` flag
- Check that the build completed successfully

### "Local file paths not supported"
- Upload images to a cloud service first
- Use publicly accessible URLs

### Task timeouts
- Check network connectivity
- Verify API key is valid
- Try with shorter duration or smaller images

### API errors
- Check DashScope console for quota/limits
- Verify API key permissions
- Check service status