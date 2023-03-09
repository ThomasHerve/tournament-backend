import { IsNotEmpty, MinLength } from "class-validator";

export class CreateTournamentDto {
    @IsNotEmpty()
    @MinLength(3)
    name: string;
}

export class DeleteTournamentDto {
    @IsNotEmpty()
    @MinLength(3)
    id: number;
}
