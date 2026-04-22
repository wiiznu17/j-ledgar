# Certificate Pinning Implementation

## Current Implementation (Baseline Security)

The app currently has **basic certificate validation** implemented in `src/lib/certificate-validation.ts`:

- **HTTPS enforcement**: Validates that API URLs use HTTPS
- **Domain validation**: Checks that production requests go to known domains (api.jledger.io)
- **Runtime validation**: Validates connection security before each API request

This provides a security baseline but is **not true certificate pinning**.

## True Certificate Pinning (Requires EAS Build)

For production-grade certificate pinning, the following steps are required:

### 1. Switch to Expo Development Build (EAS Build)

Currently the app uses Expo managed workflow. Certificate pinning requires custom native code.

```bash
# Initialize EAS Build
eas build:configure

# Create development build
eas build --profile development
```

### 2. Add Certificate Pinning Library

Install a certificate pinning library:

```bash
npm install react-native-ssl-pinning
# or
npm install react-native-cert-pinner
```

### 3. Configure Android Certificate Pinning

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config>
    <domain includeSubdomains="true">api.jledger.io</domain>
    <pin-set>
      <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
      <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

Add to `AndroidManifest.xml`:

```xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  ...>
```

### 4. Configure iOS Certificate Pinning

Add to `ios/Podfile`:

```ruby
pod 'TrustKit', '~> 2.0'
```

Configure in `AppDelegate.m`:

```objective-c
#import <TrustKit/TrustKit.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  NSDictionary *trustKitConfig = @{
    kTSKSwizzleNetworkDelegates: @YES,
    kTSKPinnedDomains: @{
      @"api.jledger.io": @{
        kTSKEnforcePinning: @YES,
        kTSKIncludeSubdomains: @YES,
        kTSKPublicKeyHashes: @[
          @"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          @"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="
        ]
      }
    }
  };

  [TrustKit initSharedInstanceWithConfiguration:trustKitConfig];
  return YES;
}
```

### 5. Extract Certificate Fingerprints

Get the actual certificate fingerprints from your server:

```bash
# For production API
openssl s_client -connect api.jledger.io:443 -showcerts </dev/null 2>/dev/null | openssl x509 -noout -fingerprint -sha256
```

Replace the placeholder hashes in the configuration with actual values.

### 6. Implement Pinning in Axios

Update `src/lib/axios.ts` to use the pinning library:

```typescript
import SslPinningPlugin from 'react-native-ssl-pinning';

// In request interceptor
api.interceptors.request.use(async (config) => {
  if (__DEV__) {
    return config; // Skip pinning in development
  }

  try {
    await SslPinningPlugin.certificatePinning(
      'GET',
      config.url!,
      {
        validDomains: ['api.jledger.io'],
        hashes: [
          'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
        ],
      },
    );
  } catch (error) {
    console.error('Certificate pinning failed:', error);
    return Promise.reject(new Error('Certificate validation failed'));
  }

  return config;
});
```

## Migration Path

1. **Phase 1 (Current)**: Basic HTTPS and domain validation ✅
2. **Phase 2**: Switch to EAS Build
3. **Phase 3**: Add native certificate pinning
4. **Phase 4**: Test with staging environment
5. **Phase 5**: Deploy to production with certificate rotation plan

## Certificate Rotation

When certificates are rotated:

1. Update the certificate hashes in the configuration
2. Support both old and new certificates during transition period
3. Remove old certificates after transition completes
4. Monitor for pinning failures

## References

- [Android Network Security Configuration](https://developer.android.com/training/articles/security-config)
- [iOS Certificate Pinning with TrustKit](https://github.com/datatheorem/TrustKit)
- [React Native SSL Pinning](https://github.com/fractalbach/react-native-ssl-pinning)
- [OWASP Certificate Pinning Guide](https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html)
