import { Address, DefaultListener, NaturalNumber } from "./ram.js";

export class CostModel {
  duration(instruction: NaturalNumber[]): number {
    return 1;
  }
}

export class PerformanceMeter extends DefaultListener {
  readonly #costModel: CostModel;
  #clock = 0;
  #inputCount = 0;
  #outputCount = 0;
  #steps = 0;
  #cellsTouched: Set<number> = new Set();

  constructor(costModel: CostModel) {
    super();
    this.#costModel = costModel;
  }

  onInstructionExecuted(instruction: NaturalNumber[]): void {
    this.#clock += this.#costModel.duration(instruction);
    this.#steps += 1;
  }

  onMemoryUpdated(address: Address): void {
    this.#cellsTouched.add(address.toJsNumber());
  }

  onAccUpdated(): void {}

  onIpUpdated(): void {}

  onInput(): void {
    this.#inputCount += 1;
  }

  onOutput(): void {
    this.#outputCount += 1;
  }

  onMachineStarted(): void {
    this.#clock = 0;
    this.#steps = 0;
    this.#cellsTouched = new Set();
    this.#inputCount = 0;
    this.#outputCount = 0;
  }

  onMachineStopped(): void {}

  get clock(): number {
    return this.#clock;
  }

  get inputCount(): number {
    return this.#inputCount;
  }

  get outputCount(): number {
    return this.#outputCount;
  }

  get steps(): number {
    return this.#steps;
  }

  get cellsTouched(): number {
    return this.#cellsTouched.size;
  }
}
