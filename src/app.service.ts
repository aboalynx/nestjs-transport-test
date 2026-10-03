import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(id: number): string {
    console.log('A'); // 1
    setTimeout(() => console.log('B'), 0); // 4
    Promise.resolve().then(() => console.log('C')); // 3
    process.nextTick(() => console.log('D')); // 2
    setImmediate(() => console.log('E')); // 4
    console.log('F'); // 1

    return 'Hello World!' + id;
  }
}
