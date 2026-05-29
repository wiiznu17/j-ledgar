import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';
import { Expo } from 'expo-server-sdk';

const mockChunk = jest.fn();
const mockSend = jest.fn();

jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken = jest.fn();
    chunkPushNotifications = jest.fn().mockImplementation((...args) => mockChunk(...args));
    sendPushNotificationsAsync = jest.fn().mockImplementation((...args) => mockSend(...args));
  }
  return {
    Expo: MockExpo,
  };
});

describe('PushService', () => {
  let service: PushService;

  beforeEach(async () => {
    mockChunk.mockReset();
    mockSend.mockReset();
    (Expo.isExpoPushToken as any).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PushService],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if the push token is invalid', async () => {
    (Expo.isExpoPushToken as any).mockReturnValue(false);

    const result = await service.sendPushNotification('invalid-token', 'Title', 'Body');

    expect(result).toBe(false);
    expect(Expo.isExpoPushToken).toHaveBeenCalledWith('invalid-token');
    expect(mockChunk).not.toHaveBeenCalled();
  });

  it('should send push notification successfully through expo server sdk', async () => {
    (Expo.isExpoPushToken as any).mockReturnValue(true);
    mockChunk.mockReturnValue([[{ to: 'valid-token' }]]);
    mockSend.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

    const result = await service.sendPushNotification(
      'valid-token',
      'Test Title',
      'Test Body',
      { promo: 'info' }
    );

    expect(result).toBe(true);
    expect(Expo.isExpoPushToken).toHaveBeenCalledWith('valid-token');
    expect(mockChunk).toHaveBeenCalledWith([
      {
        to: 'valid-token',
        sound: 'default',
        title: 'Test Title',
        body: 'Test Body',
        data: { promo: 'info' },
      },
    ]);
    expect(mockSend).toHaveBeenCalledWith([{ to: 'valid-token' }]);
  });

  it('should log an error and return false if sending push notifications fails', async () => {
    (Expo.isExpoPushToken as any).mockReturnValue(true);
    mockChunk.mockReturnValue([[{ to: 'valid-token' }]]);
    mockSend.mockRejectedValue(new Error('Expo server error'));
    
    const loggerSpy = jest.spyOn((service as any).logger, 'error');

    const result = await service.sendPushNotification('valid-token', 'Title', 'Body');

    expect(result).toBe(false);
    expect(loggerSpy).toHaveBeenCalledWith('Error sending push notification', expect.any(Error));
  });
});
