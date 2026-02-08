import { describe, it, expect, vi } from 'vitest';

import {
  completionInstallAction,
  type Logger,
} from '../completion-install-action';

describe('completionInstallAction', () => {
  it('installs completion and logs success message', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockTabtabInstall = vi.fn().mockResolvedValue(undefined);

    await completionInstallAction({
      logger: mockLogger,
      tabtabInstall: mockTabtabInstall,
    });

    expect(mockTabtabInstall).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Shell completion installed'),
    );
  });

  it('logs restart instruction after installation', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockTabtabInstall = vi.fn().mockResolvedValue(undefined);

    await completionInstallAction({
      logger: mockLogger,
      tabtabInstall: mockTabtabInstall,
    });

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Restart your shell'),
    );
  });

  it('logs manual setup instructions when installation fails', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockTabtabInstall = vi.fn().mockRejectedValue(
      new Error('Installation failed'),
    );

    await completionInstallAction({
      logger: mockLogger,
      tabtabInstall: mockTabtabInstall,
    });

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Tabtab installation could not auto-setup completion',
      ),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Manual setup'),
    );
  });
});
