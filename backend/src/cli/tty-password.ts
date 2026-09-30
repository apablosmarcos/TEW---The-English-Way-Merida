type PasswordInput = NodeJS.ReadStream & {
  setRawMode(mode: boolean): void;
};

type PasswordOutput = { write(message: string): void };

export async function readPassword(input: PasswordInput, output: PasswordOutput, prompt: string): Promise<string> {
  output.write(prompt);
  let rawMode = false;
  try {
    input.setRawMode(true);
    rawMode = true;
    input.resume();
    return await new Promise<string>((resolve, reject) => {
      let password = "";
      const done = (action: () => void) => {
        input.off("data", onData);
        input.off("error", onError);
        action();
      };
      const onError = (error: Error) => done(() => reject(error));
      const onData = (chunk: Buffer | string) => {
        try {
          for (const character of Buffer.from(chunk).toString()) {
            if (character === "\r" || character === "\n") {
              output.write("\n");
              return done(() => resolve(password));
            }
            if (character === "\u0003") return done(() => reject(new Error("Input interrupted.")));
            if (character === "\b" || character === "\u007f") password = password.slice(0, -1);
            else if (character >= " ") password += character;
          }
        } catch (error) {
          done(() => reject(error));
        }
      };
      input.on("data", onData);
      input.once("error", onError);
    });
  } finally {
    try {
      input.pause();
    } finally {
      if (rawMode) input.setRawMode(false);
    }
  }
}
