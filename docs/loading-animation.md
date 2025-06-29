# Loading Animation Implementation

## Overview

The LuckSeeker LINE Bot now includes a loading animation feature that improves user experience by showing visual feedback during AI fortune-telling processing.

## How It Works

When a user selects a fortune category (ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน), the bot:

1. **Shows Loading Animation**: Displays a loading indicator for up to 20 seconds
2. **Processes AI Request**: Calls OpenAI or Claude API to generate fortune reading
3. **Sends Response**: The loading animation automatically disappears when the response is sent

## Implementation Details

### Code Location
- **File**: `src/controllers/lineController.js`
- **Function**: `handleFortuneCategory()`

### API Used
- **Direct REST API**: `https://api.line.me/v2/bot/chat/loading/start`
- **HTTP Method**: POST
- **Authentication**: Bearer token using channel access token
- **Parameters**:
  - `chatId`: User ID from the event
  - `loadingSeconds`: 20 seconds (sufficient for AI response)

### Implementation

Since the LINE Bot SDK v8.0.3 doesn't include the `showLoadingAnimation` method, we use direct API calls:

```javascript
// Helper function to show loading animation using direct API call
async function showLoadingAnimation(userId, loadingSeconds = 20) {
  try {
    return await axios({
      method: "post",
      url: "https://api.line.me/v2/bot/chat/loading/start",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.line.channelAccessToken}`
      },
      data: { 
        chatId: userId,
        loadingSeconds: loadingSeconds
      }
    });
  } catch (error) {
    console.error('Loading animation API error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Error Handling

The implementation includes robust error handling:

```javascript
try {
  await showLoadingAnimation(userId, 20);
} catch (loadingError) {
  console.warn('Failed to show loading animation:', loadingError);
  // Continue without loading animation if it fails
}
```

If the loading animation fails:
- A warning is logged but processing continues
- The fortune telling still works normally
- User gets their response without interruption

## Requirements

- **LINE Bot SDK**: Version 8.0.3 or higher (using direct REST API)
- **Dependencies**: axios for HTTP requests
- **Chat Type**: Only works in one-on-one chats (not group chats)  
- **User State**: User must be viewing the chat screen to see animation
- **Authentication**: Valid LINE channel access token

## Benefits

1. **Better UX**: Users know the bot is processing their request
2. **Professional Feel**: Provides visual feedback during 3-5 second AI delays  
3. **No Timeouts**: Users won't think the bot is broken during processing
4. **Graceful Degradation**: Still works even if loading animation fails

## Testing

Comprehensive test coverage includes:
- ✅ Successful loading animation + fortune response
- ✅ Loading animation failure handling
- ✅ Missing birth chart scenarios
- ✅ Fortune service error handling
- ✅ All fortune categories (ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน)

## Configuration

The loading duration can be adjusted by changing the `loadingSeconds` parameter:

```javascript
await client.showLoadingAnimation({
  chatId: userId,
  loadingSeconds: 20 // Adjust based on typical AI response time
});
```

**Recommended range**: 15-30 seconds for AI fortune telling
**Maximum allowed**: 60 seconds
**Minimum allowed**: 5 seconds