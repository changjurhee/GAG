#include "BangGuChaSmoke.h"
#include "BangGuChaEnemy.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"

ABangGuChaSmoke::ABangGuChaSmoke() {
  PrimaryActorTick.bCanEverTick = false;

  CollisionComp = CreateDefaultSubobject<UBoxComponent>(TEXT("CollisionComp"));
  RootComponent = CollisionComp;
  CollisionComp->SetBoxExtent(FVector(45.f, 45.f, 45.f));
  CollisionComp->SetCollisionProfileName(TEXT("Trigger"));

  MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
  MeshComp->SetupAttachment(RootComponent);

  LifeSpan = 2.0f;
}

void ABangGuChaSmoke::BeginPlay() {
  Super::BeginPlay();
  SetLifeSpan(LifeSpan);
}

void ABangGuChaSmoke::NotifyActorBeginOverlap(AActor *OtherActor) {
  Super::NotifyActorBeginOverlap(OtherActor);

  if (ABangGuChaEnemy *Enemy = Cast<ABangGuChaEnemy>(OtherActor)) {
    Enemy->Stun();
  }
}
