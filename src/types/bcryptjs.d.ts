declare module 'bcryptjs' {
  function hash(s: string, salt: number | string): Promise<string>;
  function hashSync(s: string, salt: number | string): string;
  function compare(s: string, hash: string): Promise<boolean>;
  function compareSync(s: string, hash: string): boolean;
  function genSalt(rounds?: number): Promise<string>;
  function genSaltSync(rounds?: number): string;
  function getRounds(hash: string): number;

  const bcryptjs: {
    hash: typeof hash;
    hashSync: typeof hashSync;
    compare: typeof compare;
    compareSync: typeof compareSync;
    genSalt: typeof genSalt;
    genSaltSync: typeof genSaltSync;
    getRounds: typeof getRounds;
  };

  export = bcryptjs;
}
