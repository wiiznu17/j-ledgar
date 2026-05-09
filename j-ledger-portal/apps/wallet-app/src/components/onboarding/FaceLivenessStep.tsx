import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { WebView } from 'react-native-webview';

interface FaceLivenessStepProps {
  visible: boolean;
  sessionId: string;
  region?: string;
  onSuccess: () => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

/**
 * FaceLivenessStep wraps the AWS Amplify FaceLivenessDetector in a WebView.
 *
 * Why WebView?
 * `@aws-amplify/ui-react-liveness` is web-only. In React Native we need to host
 * the detector inside a lightweight web page and communicate via postMessage.
 *
 * In production you would deploy a small static HTML page that imports
 * @aws-amplify/ui-react-liveness and point the WebView to that URL.
 * For local dev the inline HTML below is enough to demonstrate the flow.
 */
export const FaceLivenessStep: React.FC<FaceLivenessStepProps> = ({
  visible,
  sessionId,
  region = 'ap-southeast-1',
  onSuccess,
  onError,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!visible) return null;

  // In production, replace this with a URL to a deployed web app that hosts
  // the FaceLivenessDetector. For now we use an inline HTML skeleton that
  // demonstrates the postMessage contract.
  const livenessHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body { margin: 0; background: #000; color: #fff; font-family: system-ui; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .info { text-align: center; padding: 24px; }
        .info h2 { margin-bottom: 8px; }
        .info p { opacity: 0.7; font-size: 14px; }
        .btn { padding: 16px 32px; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 8px; }
        .btn-success { background: #10B981; color: #fff; }
        .btn-cancel { background: #374151; color: #fff; }
      </style>
    </head>
    <body>
      <div class="info">
        <h2>Face Liveness Verification</h2>
        <p>Session: ${sessionId}</p>
        <p>Region: ${region}</p>
        <p style="margin-top: 24px; opacity: 0.5; font-size: 12px;">
          In production, the AWS Amplify FaceLivenessDetector component
          will render here inside this WebView.
        </p>
        <br/>
        <button class="btn btn-success" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'LIVENESS_SUCCESS'}))">
          ✅ Simulate Success
        </button>
        <button class="btn btn-cancel" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'LIVENESS_CANCEL'}))">
          Cancel
        </button>
      </div>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'LIVENESS_SUCCESS':
          onSuccess();
          break;
        case 'LIVENESS_ERROR':
          onError(data.error || 'Liveness check failed');
          break;
        case 'LIVENESS_CANCEL':
          onCancel();
          break;
      }
    } catch (e) {
      console.error('FaceLiveness WebView message error:', e);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>สแกนใบหน้า</Text>
        <Text style={styles.subtitle}>กรุณาวางใบหน้าให้อยู่ในกรอบ และทำตามคำแนะนำบนหน้าจอ</Text>
      </View>

      <View style={styles.webviewContainer}>
        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Loading Liveness Detector...</Text>
          </View>
        )}
        <WebView
          source={{ html: livenessHtml }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
        />
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 24,
    margin: 16,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
});
