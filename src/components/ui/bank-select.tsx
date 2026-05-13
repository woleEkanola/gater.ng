"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bank {
  name: string;
  code: string;
}

interface BankSelectProps {
  banks: Bank[];
  value?: string;
  onChange: (bankCode: string, bankName: string) => void;
  disabled?: boolean;
}

export function BankSelect({ banks, value, onChange, disabled }: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selectedBank = banks.find((b) => b.code === value);

  const filteredBanks = search.trim()
    ? banks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : banks;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 border rounded-lg text-sm bg-background",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:bg-muted cursor-pointer"
        )}
        disabled={disabled}
      >
        <span className={cn(!selectedBank && "text-muted-foreground")}>
          {selectedBank ? selectedBank.name : "Select bank..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-background p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
          <div className="p-1">
            {filteredBanks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No bank found.</p>
            ) : (
              filteredBanks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => {
                    onChange(bank.code, bank.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-muted",
                    value === bank.code && "bg-muted"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === bank.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {bank.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
