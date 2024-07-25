import {
  AsyncPromptConfig,
  createPrompt,
  isBackspaceKey,
  isEnterKey,
  useKeypress,
  useState
} from '@inquirer/core';
import { Prompt } from '@inquirer/type';
import chalk from 'chalk';

type CustomInputConfig = AsyncPromptConfig & {
  default?: string;
  transformer?: (value: string, { isFinal }: { isFinal: boolean }) => string;
};

export const customInput = createPrompt<string, CustomInputConfig>(
  (config, done) => {
    const [status, setStatus] = useState<string>('pending');
    const [defaultValue, setDefaultValue] = useState<string | undefined>(
      config.default
    );
    const [errorMsg, setError] = useState<string | undefined>(undefined);
    const [value, setValue] = useState<string>('');

    useKeypress(async (key, rl) => {
      // Ignore keypress while our prompt is doing other processing.
      if (status !== 'pending') {
        return;
      }

      if (isEnterKey(key)) {
        const answer = value || defaultValue || '';
        setStatus('loading');
        const isValid = await config.validate(answer);
        if (isValid === true) {
          setValue(answer);
          setStatus('done');
          done(answer);
        } else {
          // TODO: Can we keep the value after validation failure?
          // `rl.line = value` works but it looses the cursor position.
          setValue('');
          setError(isValid || 'You must provide a valid value');
          setStatus('pending');
        }
      } else if (isBackspaceKey(key) && !value) {
        setDefaultValue(undefined);
      } else {
        setValue(rl.line);
        setError(undefined);
      }
    });

    const message = chalk.bold(config.message);
    let formattedValue = value;
    if (typeof config.transformer === 'function') {
      formattedValue = config.transformer(value, {
        isFinal: status === 'done'
      });
    }
    if (status === 'done') {
      formattedValue = chalk.cyan(formattedValue);
    }

    let defaultStr = '';
    if (defaultValue && status !== 'done' && !value) {
      defaultStr = chalk.dim(` (${defaultValue})`);
    }

    let error = '';
    if (errorMsg) {
      error = chalk.red(`> ${errorMsg}`);
    }

    return [`${message}${defaultStr} ${formattedValue}`, error];
  }
);

type CustomPasswordConfig = Parameters<typeof customInput>[0] & {
  mask?: boolean | string;
};

export const customPassword: Prompt<string, CustomPasswordConfig> = (
  config,
  context
) => {
  if (config.transformer) {
    throw new Error(
      'Inquirer password prompt do not support custom transformer function. Use the input prompt instead.'
    );
  }

  return customInput(
    {
      ...config, // Make sure we do not display the default password
      default: undefined,
      transformer(input: string, { isFinal }: { isFinal: boolean }) {
        if (config.mask) {
          return String(config.mask).repeat(input.length);
        }

        if (!isFinal) {
          return chalk.dim('[input is masked]');
        }

        return '';
      }
    },
    context
  );
};
