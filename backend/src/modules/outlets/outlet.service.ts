import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../../db/data-source";
import { Outlet } from "../../entities/Outlet";
import { ReceiptSequence } from "../../entities/ReceiptSequence";
import { ApiError } from "../../utils/ApiError";
import type { CreateOutletBody, UpdateOutletBody } from "./outlet.validation";
import { outletRepository } from "./outlet.repository";

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === "23505"
  );
}

export async function createOutlet(input: CreateOutletBody): Promise<Outlet> {
  const normalizedCode = input.code.trim();
  const duplicate = await outletRepository.findByCode(normalizedCode);
  if (duplicate) {
    throw ApiError.conflict("Outlet code already exists");
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const outlet = queryRunner.manager.create(Outlet, {
      name: input.name.trim(),
      code: normalizedCode,
      address: input.address ?? null,
      isActive: true,
    });
    await queryRunner.manager.save(outlet);

    const receiptSequence = queryRunner.manager.create(ReceiptSequence, {
      outletId: outlet.id,
      lastNumber: 0,
    });
    await queryRunner.manager.save(receiptSequence);

    await queryRunner.commitTransaction();
    return outlet;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    if (isUniqueViolation(err)) {
      throw ApiError.conflict("Outlet code already exists");
    }
    throw err;
  } finally {
    await queryRunner.release();
  }
}

export async function getAllOutlets(): Promise<Outlet[]> {
  return outletRepository.findAll();
}

export async function getOutletById(id: string): Promise<Outlet> {
  const outlet = await outletRepository.findById(id);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }
  return outlet;
}

export async function updateOutlet(
  id: string,
  body: UpdateOutletBody
): Promise<Outlet> {
  const outlet = await outletRepository.findById(id);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  if (body.name !== undefined) {
    outlet.name = body.name.trim();
  }
  if (body.address !== undefined) {
    outlet.address = body.address;
  }
  if (body.isActive !== undefined) {
    outlet.isActive = body.isActive;
  }

  return outletRepository.save(outlet);
}
