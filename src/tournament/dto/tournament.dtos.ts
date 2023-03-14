import { IsNotEmpty, MinLength } from "class-validator";

// Public

export class TournamentFilter {
    @IsNotEmpty()
    filter: string;
}

// With auth

export class CreateTournamentDto {
    @IsNotEmpty()
    @MinLength(3)
    name: string;
}

export class DeleteTournamentDto {
    @IsNotEmpty()
    id: number;
}

// Entries

export class TournamentEntries {
    entries: {
        name: string,
        link: string
    }[]
}
