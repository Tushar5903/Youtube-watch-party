import { serverPath } from "./utils";
 
export async function generateName() {
  const response = await fetch(serverPath + "/generateName");
  return response.text();
}