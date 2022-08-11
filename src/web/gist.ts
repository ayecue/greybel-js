import axios from 'axios';

const HOST = 'https://gist.github.com/';

export default class GithubGist {
  host: string;

  constructor(host: string = HOST) {
    this.host = host;
  }

  async get(gistAddress: string): Promise<string> {
    try {
      const res = await axios.get(`${HOST}/${gistAddress}`, {
        withCredentials: false
      });
      return res.data;
    } catch (err: any) {
      return Promise.reject(err);
    }
  }
}
