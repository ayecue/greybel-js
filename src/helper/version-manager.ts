import GreyHackMessageHookClientPkg from 'greyhack-message-hook-client';
import { logger } from './logger.js';
import { ansiProvider } from '../execute/output.js';
import { ColorType } from 'another-ansi';
import { default as storage } from 'node-persist';

const { ContextAgent } = GreyHackMessageHookClientPkg;

storage.initSync();

interface HealthCheckResult {
  active: boolean;
  isSessionActive: boolean;
  isSingleplayer: boolean;
  pluginVersion: string;
  gameVersion: string;
  error?: string;
}

export class VersionManager {
  static LATEST_MESSAGE_HOOK_VERSION: string = '0.6.14';
  static RESOURCE_LINK: string = 'https://github.com/ayecue/greybel-vs?tab=readme-ov-file#message-hook';
  
  private static _notificationInterval: number = 1000 * 60 * 60; // 1 hours
  
  private static async shouldVerify() {
    const lastNotification: string | null = await storage.getItem('lastNotification');

    if (lastNotification == null) {
      return true;
    }
  
    const oldDate = new Date(lastNotification);
    const now = new Date();
    const timeSinceLastNotification = now.getTime() - oldDate.getTime();
  
    if (timeSinceLastNotification >= this._notificationInterval) {
      return true;
    }
  
    return false;
  }

  private static async showNotification(message: string) {
    const lastNotification: string | null = await storage.getItem('lastNotification');

    if (lastNotification == null) {
      await storage.setItem('lastNotification', new Date().toISOString());
      logger.debug(
        ansiProvider.color(
          ColorType.Yellow,
          message
        )
      );
      return;
    }
  
    const oldDate = new Date(lastNotification);
    const now = new Date();
    const timeSinceLastNotification = now.getTime() - oldDate.getTime();
  
    if (timeSinceLastNotification >= this._notificationInterval) {
      logger.debug(
        ansiProvider.color(
          ColorType.Yellow,
          message
        )
      );
      await storage.setItem('lastNotification', now.toISOString());
    }
  }
  
  private static isTimeoutError(message: string): boolean {
    return /^Didn't receive response within \d+ms.$/.test(message);
  }

  private static isNotOutdated(myVersion: string): boolean {
    const v1 = myVersion.split(".");
    const v2 = this.LATEST_MESSAGE_HOOK_VERSION.split(".");
    const minLength = Math.min(v1.length, v2.length);
  
    for (let i = 0; i < minLength; i++) {
      const a = +v1[i];
      const b = +v2[i];
        if(a > b) {
            return true;
        }
        if(a < b) {
            return false;
        }           
    }
  
    return v1.length >= v2.length;
  }

  static async performHealthCheck(agent: any): Promise<HealthCheckResult> {
    try {
      const response = await agent.healthcheck();
      return response;
    } catch (err) {
      return {
        active: false,
        isSessionActive: false,
        isSingleplayer: false,
        pluginVersion: "0.0.0",
        gameVersion: "0.0.0",
        error: err.message
      };
    }
  }

  static async verifyGameAgent(agent: any): Promise<void> {
    const shouldVerify = await this.shouldVerify();

    if (!shouldVerify) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onReady = async () => {
        const response = await this.performHealthCheck(agent);

        if (!this.isNotOutdated(response.pluginVersion) && response.error == null) {
          await this.showNotification(`Greybel message-hook is outdated! You are currently using version "${response.pluginVersion}". Please download the latest version "${this.LATEST_MESSAGE_HOOK_VERSION}" from ${this.RESOURCE_LINK}.`);
        } else if (this.isTimeoutError(response.error)) {
          await this.showNotification(`Greybel message-hook is outdated! You are currently using version a version below "0.6.0". Please download the latest version "${this.LATEST_MESSAGE_HOOK_VERSION}" from ${this.RESOURCE_LINK}.`);
        }

        dispose();
      };
      const dispose = () => {
        clearTimeout(timeout);
        agent.gameClient.removeListener('ready', onReady);
        resolve();
      };
      const timeout = setTimeout(() => {
        dispose();
      });

      agent.gameClient.addListener('ready', onReady);
    });
  }

  static async verifyContextAgent(agent: any): Promise<void> {
    const shouldVerify = await this.shouldVerify();

    if (!shouldVerify) {
      return;
    }

    const response = await this.performHealthCheck(agent);

    if (!this.isNotOutdated(response.pluginVersion) && response.error == null) {
      await this.showNotification(`Greybel message-hook is outdated! You are currently using version "${response.pluginVersion}". Please download the latest version "${this.LATEST_MESSAGE_HOOK_VERSION}" from ${this.RESOURCE_LINK}.`);
    } else if (this.isTimeoutError(response.error)) {
      await this.showNotification(`Greybel message-hook is outdated! You are currently using version a version below "0.6.0". Please download the latest version "${this.LATEST_MESSAGE_HOOK_VERSION}" from ${this.RESOURCE_LINK}.`);
    }
  }

  static async triggerContextAgentHealthcheck(port?: number): Promise<void> {
    const shouldVerify = await this.shouldVerify();

    if (!shouldVerify) {
      return;
    }

    try {
      const agent = new ContextAgent({
        warn: () => { },
        error: () => { },
        info: () => { },
        debug: () => { }
      }, port);

      await this.verifyContextAgent(agent);
      await agent.dispose();
    } catch (err) {
      console.error('Error while triggering agent healtcheck: ', err.message);
    }
  }
}